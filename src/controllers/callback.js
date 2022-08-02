const { settings } = require('service-claire/helpers/config');
const logger = require('service-claire/helpers/logger');
const { ok } = require('service-claire/helpers/responses');
const {
  Auth,
  Message,
} = require('../models');
const {
  suggestResponse,
  suggestResponseResponse,
  createResponse,
  createResponseResponse,
  improve,
  lessen,
} = require('../services/suggest');
const { handleOauthOnboarding } = require('./oauth');
const ClarityHub = require('node-clarity-hub');

const { chatUrl, suggestionUrl } = settings;

/**
 * Seperate messages into two bins based on
 * participant uuids. This will throw out
 * any messages after two bins
 *
 * @private
 */
const separateBins = (messages) => {
  const bins = [[]];

  if (messages.length === 0) {
    return [];
  }

  let binIndex = 0;
  let currentPid = messages[0].participantId;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];

    // Ignore system messages
    if (m.participantId !== '-1') {
      if (currentPid !== m.participantId) {
        if (binIndex === 1) {
          break;
        }

        currentPid = m.participantId;
        binIndex += 1;
        bins.push([]);
      }

      bins[binIndex].push(m);
    }
  }

  return bins;
};

/**
 * Given an array of messages, take all
 * the texts and merge them together
 */
const mergeTexts = (messages) => {
  return messages.map(m => m.text).join('\n');
};

/**
 * @private
 */
const handleNewMessage = async ({
  accountId,
  event,
}) => {
  const {
    uuid: messageUuid,
    text,
    chatUuid,
    participantId,
    participantType,
  } = event;

  try {
    // Get the last 20 messages from newest to oldest
    const messages = await Message.findAll({
      where: {
        chatUuid,
      },
      limit: 20,
      order: [
        ['createdAt', 'DESC'],
      ],
    });

    let bins;
    let message;
    let isNew;

    /*
    * if its a system message (participant joined, most likely)
    * suggest based off of the message that came before that
    * if its a resolve message, don't do anything.
    */
    if (participantId === '-1') {
      if (text.indexOf('ended the chat') > -1) {
        return;
      }
      bins = separateBins(messages);
      message = messages[0]; //eslint-disable-line
      isNew = false;
    } else {
      [message, isNew] = await Message.findOrCreate({
        where: {
          accountId,
          chatUuid,
          messageUuid,
        },
        defaults: {
          accountId,
          chatUuid,
          messageUuid,
          participantId,
          participantType,
          text,
        },
      });
      bins = separateBins([message, ...messages]);
    }
    let suggestions = null;

    if (message.participantType === 'client') {
      /*
       * The client made a message
       */
      const mergedText = mergeTexts(bins[0]);
      suggestions = await suggestResponse({
        type: 'chat',
        text: mergedText,
        limit: 3,
        accountId,
      });
    } else if (isNew) {
      if (messages.length > 0) {
        if (messages[0].responseUuid !== null &&
          messages[0].participantId === message.participantId) {
          /**
           * A new message came in and the previous message
           * has a responseUuid tagged onto it, so we are
           * going to form a chain
           */
          const responseText = bins[0][0].text;
          // XXX escape names
          const { uuid } = await createResponseResponse({
            accountId,
            participantId,
            responseUuid: messages[0].responseUuid,
            responseText,
            type: 'chat',
          });

          await Message.update({
            responseUuid: uuid,
          }, {
            where: {
              id: message.id,
            },
          });
        } else if (messages[0].editResponseUuid !== null) {
          /**
           * Message is created by an edit
           */
          suggestions = await suggestResponseResponse({
            responseUuid: messages[0].editResponseUuid,
            accountId,
          });
        } else if (bins.length > 1) {
          // XXX make sure there are enough bins
          const requestText = mergeTexts(bins[1]);
          const responseText = bins[0][0].text;
          // XXX escape names
          const { uuid } = await createResponse({
            requestText,
            responseText,
            type: 'chat',
            participantId: bins[0][0].participantId,
            accountId,
          });

          // Update the message with the given uuid
          Message.update({
            responseUuid: uuid,
          }, {
            where: {
              id: bins[0][0].id,
            },
          });
        } else {
          // We didn't grab enough messages
          // TODO in the future, retry once more with
          // a greater limit.
        }
      }
    } else {
      const { responseUuid } = message;

      suggestions = await suggestResponseResponse({
        responseUuid,
        accountId,
      });
    }

    // Finally, lets send some suggestions!

    if (suggestions && suggestions.length > 0) {
      const auth = await Auth.findOne({
        where: {
          accountId,
        },
      });

      const clarityHub = new ClarityHub({
        accessToken: auth.accessToken,
        url: suggestionUrl,
      });

      await clarityHub.suggestions.create({
        chatUuid,
        messageUuid,
        suggestions: suggestions.map((s) => {
          return {
            text: s.text,
            actions: [
              {
                name: 'Delete',
                value: 'delete',
                icon: 'trash',
                meta: {
                  responseUuid: s.uuid,
                },
              }, {
                name: 'Edit',
                value: 'edit',
                icon: 'pencil',
                meta: {
                  responseUuid: s.uuid,
                },
              }, {
                name: 'Send',
                value: 'send',
                icon: 'paper-plane',
                meta: {
                  responseUuid: s.uuid,
                },
              },
            ],
          };
        }),
      });
    }
  } catch (err) {
    logger.error(err);
  }
};

/**
 * An action has been sent back to us
 *
 * @private
 */
const handleActionSelected = async ({
  accountId,
  event,
}) => {
  const { user, suggestion, actionValue } = event;
  const {
    uuid,
    messageUuid,
    chatUuid,
    text,
  } = suggestion;
  const { uuid: userUuid } = user;
  const { responseUuid } = suggestion.actions[0].meta;

  try {
    switch (actionValue) {
      case 'delete': {
        const message = await Message.findOne({
          where: {
            chatUuid,
            messageUuid,
          },
        });

        if (message && message.participantType === 'client') {
          lessen({
            responseUuid,
            type: 'request-response',
            accountId,
          });
        } else if (message && message.participantType !== 'client') {
          // The message SHOULD have a responseUuid
          if (message.responseUuid) {
            const from = message.responseUuid;
            lessen({
              responseUuid,
              from,
              type: 'response-reponse',
              accountId,
            });
          } else {
            logger.error(`A message (${message.id}) should have a responseUuid but it doesn't`);
          }
        }

        const auth = await Auth.findOne({
          where: {
            accountId,
          },
        });

        const clarityHub = new ClarityHub({
          accessToken: auth.accessToken,
          url: suggestionUrl,
          asUser: userUuid,
        });

        await clarityHub.suggestions.delete({
          suggestionUuid: uuid,
        });
        break;
      }
      case 'send': {
        const message = await Message.findOne({
          where: {
            chatUuid,
            messageUuid,
          },
        });

        if (message && message.participantType === 'client') {
          improve({
            responseUuid,
            type: 'request-response',
            accountId,
          });
        } else if (message && message.participantType !== 'client') {
          // The message SHOULD have a responseUuid
          if (message.responseUuid) {
            const from = message.responseUuid;
            improve({
              responseUuid,
              from,
              type: 'response-reponse',
              accountId,
            });
          } else {
            logger.error(`A message (${message.id}) should have a responseUuid but it doesn't`);
          }
        }

        const auth = await Auth.findOne({
          where: {
            accountId,
          },
        });

        const clarityHub = new ClarityHub({
          accessToken: auth.accessToken,
          url: chatUrl,
          asUser: userUuid,
        });

        // create the message locally
        const newMessage = await Message.create({
          text,
          chatUuid,
          accountId,
          responseUuid,
        });

        const response = await clarityHub.chatMessages.create({
          chatUuid,
          text,
        });

        // update with response
        await Message.update({
          messageUuid: response.uuid,
          participantId: response.participantId,
          participantType: response.participantType,
        }, {
          where: {
            id: newMessage.id,
          },
        });

        break;
      }
      case 'edit': {
        const message = await Message.findOne({
          where: {
            chatUuid,
            messageUuid,
          },
        });

        if (message && message.participantType === 'client') {
          improve({
            responseUuid,
            type: 'request-response',
            accountId,
          });
        } else if (message && message.participantType !== 'client') {
          // The message SHOULD have a responseUuid
          if (message.responseUuid) {
            const from = message.responseUuid;
            improve({
              responseUuid,
              from,
              type: 'response-reponse',
              accountId,
            });
          } else {
            logger.error(`A message (${message.id}) should have a responseUuid but it doesn't`);
          }
        }

        const auth = await Auth.findOne({
          where: {
            accountId,
          },
        });

        const clarityHub = new ClarityHub({
          accessToken: auth.accessToken,
          url: chatUrl,
          asUser: userUuid,
        });

        await clarityHub.chatMessages.compose({
          chatUuid,
          text,
        });

        const clarityHub2 = new ClarityHub({
          accessToken: auth.accessToken,
          url: suggestionUrl,
          asUser: userUuid,
        });

        await clarityHub2.suggestions.delete({
          suggestionUuid: uuid,
        });

        break;
      }
      default:
      // Do nothing
    }
  } catch (err) {
    logger.error(err);
  }
};

/**
 * When a user creates a new account, we are automatically
 * given an oauth access token for that account.
 *
 * @private
 */
const handleOauth = ({ event }) => {
  const { accessToken, accountId } = event;

  handleOauthOnboarding({
    accessToken,
    accountId,
  });
};

const handleOauthRevoked = async ({ event }) => {
  const { accessToken, accountId } = event;

  try {
    await Auth.destroy({
      where: {
        accessToken,
        accountId,
      },
    });
  } catch (err) {
    logger.error(err);
  }
};

const callback = (req, res) => {
  const { type, eventType } = req.body;

  if (type === 'event_callback' && eventType === 'chat-message.created') {
    handleNewMessage(req.body);
  } else if (type === 'action_callback') {
    handleActionSelected(req.body);
  } else if (type === 'oauth_callback' && eventType === 'integration.activated') {
    handleOauth(req.body);
  } else if (type === 'oauth_callback' && eventType === 'integration.revoked') {
    handleOauthRevoked(req.body);
  }

  ok(res)({});
};

module.exports = {
  callback,
};
