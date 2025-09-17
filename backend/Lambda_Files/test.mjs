import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

// Initialize the Bedrock client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

// Initialize API Gateway Management API client
let apiGwManagementClient;

export const handler = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));

    // For WebSocket connections
    if (event.requestContext && event.requestContext.connectionId) {
      // Initialize API Gateway Management API client with the correct endpoint
      const domain = event.requestContext.domainName;
      const stage = event.requestContext.stage;
      apiGwManagementClient = new ApiGatewayManagementApiClient({
        endpoint: `https://${domain}/${stage}`,
      });

      // Extract connection ID for WebSocket communication
      const connectionId = event.requestContext.connectionId;

      // Handle different message types
      if (event.body) {
        const body = JSON.parse(event.body);

        if (body.action === "startStream") {
          // Start Nova Sonic streaming session
          return await startStreamingSession(
            connectionId,
            body.systemPrompt || null
          );
        } else if (body.action === "sendMessage") {
          // Send message to existing streaming session
          return await sendMessageToStream(
            connectionId,
            body.message,
            body.streamId
          );
        } else if (body.action === "endStream") {
          // End streaming session
          return await endStreamingSession(connectionId, body.streamId);
        }
      }

      // Default response for WebSocket
      return { statusCode: 400, body: "Invalid request action" };
    }

    // For REST API/HTTP API requests
    else {
      const body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;

      if (body.action === "startStream") {
        // Start and handle Nova Sonic session synchronously
        return await handleSynchronousSession(
          body.message,
          body.systemPrompt || null
        );
      }

      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Invalid request type or missing action",
        }),
      };
    }
  } catch (error) {
    console.error("Error:", error);

    // For WebSocket connections, send error to client
    if (event.requestContext && event.requestContext.connectionId) {
      try {
        await sendToConnection(event.requestContext.connectionId, {
          type: "error",
          error: error.message,
        });
      } catch (e) {
        console.error("Error sending error message to client:", e);
      }
    }

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

/**
 * Start a bidirectional streaming session with Nova Sonic
 */
async function startStreamingSession(connectionId, systemPrompt) {
  console.log("Starting streaming session");

  // Create a unique ID for this streaming session
  const streamId = `stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Store stream objects in DynamoDB or other storage
  // This would be needed in a production environment to manage sessions

  // Create bidirectional streaming command
  const command = new InvokeModelWithBidirectionalStreamCommand({
    modelId: "amazon.nova-sonic-v1:0",
  });

  // Start the stream
  const stream = await bedrockClient.send(command);

  // Send session start event
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            sessionStart: {
              inferenceConfiguration: {
                maxTokens: 1024,
                topP: 0.9,
                temperature: 0.7,
              },
            },
          },
        })
      ),
    },
  });

  // Send prompt start event
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            promptStart: {
              promptName: "conversation",
              textOutputConfiguration: {
                mediaType: "text/plain",
              },
            },
          },
        })
      ),
    },
  });

  // Send system prompt if provided
  if (systemPrompt) {
    await stream.input.write({
      chunk: {
        bytes: Buffer.from(
          JSON.stringify({
            event: {
              contentStart: {
                promptName: "conversation",
                contentName: "systemPrompt",
                type: "TEXT",
                role: "SYSTEM",
                textInputConfiguration: {
                  mediaType: "text/plain",
                },
              },
            },
          })
        ),
      },
    });

    await stream.input.write({
      chunk: {
        bytes: Buffer.from(
          JSON.stringify({
            event: {
              textInput: {
                promptName: "conversation",
                contentName: "systemPrompt",
                content: systemPrompt,
              },
            },
          })
        ),
      },
    });

    await stream.input.write({
      chunk: {
        bytes: Buffer.from(
          JSON.stringify({
            event: {
              contentEnd: {
                promptName: "conversation",
                contentName: "systemPrompt",
              },
            },
          })
        ),
      },
    });
  }

  // Store the stream for this connection
  // In a production app, you'd store this in DynamoDB or similar
  global[`stream_${streamId}`] = stream;

  // Set up stream processor (don't await, we want it to run asynchronously)
  processStreamOutput(stream, connectionId, streamId);

  // Notify the client that the stream has started
  await sendToConnection(connectionId, {
    type: "streamStarted",
    streamId: streamId,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Streaming session started",
      streamId: streamId,
    }),
  };
}

/**
 * Process the output stream from Nova Sonic
 */
async function processStreamOutput(stream, connectionId, streamId) {
  try {
    for await (const chunk of stream.output) {
      if (chunk.chunk && chunk.chunk.bytes) {
        const responseData = chunk.chunk.bytes.toString("utf-8");
        const jsonData = JSON.parse(responseData);

        // Process different event types
        if (jsonData.event) {
          // Text output from the model
          if (jsonData.event.textOutput) {
            await sendToConnection(connectionId, {
              type: "text",
              streamId: streamId,
              content: jsonData.event.textOutput.content,
              role: "assistant",
            });
          }
          // Session ended by the model
          else if (jsonData.event.sessionEnd) {
            await sendToConnection(connectionId, {
              type: "sessionEnded",
              streamId: streamId,
            });

            // Clean up the stream reference
            delete global[`stream_${streamId}`];
          }
          // Other events could be processed here
        }
      }
    }
  } catch (error) {
    console.error("Error processing stream output:", error);

    // Notify client of error
    await sendToConnection(connectionId, {
      type: "error",
      streamId: streamId,
      error: error.message,
    });

    // Clean up the stream reference on error
    delete global[`stream_${streamId}`];
  }
}

/**
 * Send a message to an existing streaming session
 */
async function sendMessageToStream(connectionId, message, streamId) {
  console.log(`Sending message to stream ${streamId}`);

  // Get the stream from global storage
  // In production, you'd retrieve this from DynamoDB or similar
  const stream = global[`stream_${streamId}`];

  if (!stream) {
    throw new Error(`Stream ${streamId} not found`);
  }

  // Unique content name for this message
  const contentName = `userMsg_${Date.now()}`;

  // Start content
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            contentStart: {
              promptName: "conversation",
              contentName: contentName,
              type: "TEXT",
              role: "USER",
              textInputConfiguration: {
                mediaType: "text/plain",
              },
            },
          },
        })
      ),
    },
  });

  // Send the actual message
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            textInput: {
              promptName: "conversation",
              contentName: contentName,
              content: message,
            },
          },
        })
      ),
    },
  });

  // End content
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            contentEnd: {
              promptName: "conversation",
              contentName: contentName,
            },
          },
        })
      ),
    },
  });

  // Echo back to the client that the message was sent
  await sendToConnection(connectionId, {
    type: "messageSent",
    streamId: streamId,
    content: message,
    role: "user",
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Message sent to stream",
      streamId: streamId,
    }),
  };
}

/**
 * End a streaming session
 */
async function endStreamingSession(connectionId, streamId) {
  console.log(`Ending stream ${streamId}`);

  // Get the stream
  const stream = global[`stream_${streamId}`];

  if (!stream) {
    throw new Error(`Stream ${streamId} not found`);
  }

  // End the prompt
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            promptEnd: {
              promptName: "conversation",
            },
          },
        })
      ),
    },
  });

  // End the session
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            sessionEnd: {},
          },
        })
      ),
    },
  });

  // Close the stream
  await stream.input.close();

  // Clean up the stream reference
  delete global[`stream_${streamId}`];

  // Notify the client that the stream has ended
  await sendToConnection(connectionId, {
    type: "streamEnded",
    streamId: streamId,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Streaming session ended",
      streamId: streamId,
    }),
  };
}

/**
 * Handle a synchronous (non-WebSocket) session
 */
async function handleSynchronousSession(message, systemPrompt = null) {
  console.log("Starting synchronous session");

  // Create bidirectional streaming command
  const command = new InvokeModelWithBidirectionalStreamCommand({
    modelId: "amazon.nova-sonic-v1:0",
  });

  // Start the stream
  const stream = await bedrockClient.send(command);

  // Send session start event
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            sessionStart: {
              inferenceConfiguration: {
                maxTokens: 1024,
                topP: 0.9,
                temperature: 0.7,
              },
            },
          },
        })
      ),
    },
  });

  // Send prompt start event
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            promptStart: {
              promptName: "conversation",
              textOutputConfiguration: {
                mediaType: "text/plain",
              },
            },
          },
        })
      ),
    },
  });

  // Send system prompt if provided
  if (systemPrompt) {
    await stream.input.write({
      chunk: {
        bytes: Buffer.from(
          JSON.stringify({
            event: {
              contentStart: {
                promptName: "conversation",
                contentName: "systemPrompt",
                type: "TEXT",
                role: "SYSTEM",
                textInputConfiguration: {
                  mediaType: "text/plain",
                },
              },
            },
          })
        ),
      },
    });

    await stream.input.write({
      chunk: {
        bytes: Buffer.from(
          JSON.stringify({
            event: {
              textInput: {
                promptName: "conversation",
                contentName: "systemPrompt",
                content: systemPrompt,
              },
            },
          })
        ),
      },
    });

    await stream.input.write({
      chunk: {
        bytes: Buffer.from(
          JSON.stringify({
            event: {
              contentEnd: {
                promptName: "conversation",
                contentName: "systemPrompt",
              },
            },
          })
        ),
      },
    });
  }

  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            contentStart: {
              promptName: "conversation", // Identifies the conversation
              contentName: contentName, // Unique identifier for this content piece
              type: "TEXT", // The type of content (text)
              role: "USER", // Who is speaking (the user)
              textInputConfiguration: {
                mediaType: "text/plain", // Format of the text
              },
            },
          },
        })
      ),
    },
  });
  const contentName = `userMsg_${Date.now()}`;

  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            contentStart: {
              promptName: "conversation",
              contentName: contentName,
              type: "TEXT",
              role: "USER",
              textInputConfiguration: {
                mediaType: "text/plain",
              },
            },
          },
        })
      ),
    },
  });

  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            textInput: {
              promptName: "conversation",
              contentName: contentName,
              content: message,
            },
          },
        })
      ),
    },
  });

  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            contentEnd: {
              promptName: "conversation",
              contentName: contentName,
            },
          },
        })
      ),
    },
  });

  // Collect the response
  let fullResponse = "";
  let finishedProcessing = false;

  // Process stream output
  const processOutput = async () => {
    try {
      for await (const chunk of stream.output) {
        if (chunk.chunk && chunk.chunk.bytes) {
          const responseData = chunk.chunk.bytes.toString("utf-8");
          const jsonData = JSON.parse(responseData);

          // Process different event types
          if (jsonData.event) {
            // Text output from the model
            if (jsonData.event.textOutput) {
              fullResponse += jsonData.event.textOutput.content;
            }
            // Session ended by the model
            else if (jsonData.event.sessionEnd) {
              finishedProcessing = true;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error processing synchronous output:", error);
      throw error;
    }
  };

  // Start processing the output
  const outputPromise = processOutput();

  // End the prompt to get final response
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            promptEnd: {
              promptName: "conversation",
            },
          },
        })
      ),
    },
  });

  // End the session
  await stream.input.write({
    chunk: {
      bytes: Buffer.from(
        JSON.stringify({
          event: {
            sessionEnd: {},
          },
        })
      ),
    },
  });

  // Close the input stream
  await stream.input.close();

  // Wait for output processing to complete
  await outputPromise;

  // Return the response
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      response: fullResponse,
    }),
  };
}

/**
 * Send a message to a WebSocket connection
 */
async function sendToConnection(connectionId, data) {
  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(data)),
    });

    await apiGwManagementClient.send(command);
  } catch (error) {
    // If connection is stale (closed), ignore the error
    if (error.statusCode === 410) {
      console.log(`Connection ${connectionId} is stale, ignoring`);
      return;
    }

    throw error;
  }
}
