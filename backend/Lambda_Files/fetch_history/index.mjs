import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

export const fetchHistory = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    const requestData =
      typeof event.body === "string" ? JSON.parse(event.body) : event;

    const { PlayerId, NPCId } = requestData;
    if (!PlayerId || !NPCId) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: "PlayerId and NPCId are required",
        }),
      };
    }

    const scanCommand = new ScanCommand({
      TableName: "NPCForge_Interaction",
      FilterExpression: "PlayerId = :playerId AND NPCId = :npcId",
      ExpressionAttributeValues: {
        ":playerId": { S: PlayerId },
        ":npcId": { S: NPCId },
      },
    });

    console.log("Scanning DynamoDB for interactions...");
    const result = await dynamoClient.send(scanCommand);
    const interactions = result.Items
      ? result.Items.map((item) => unmarshall(item))
      : [];
    console.log(`Found ${interactions.length} interactions`);

    if (interactions.length === 0) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: true,
          summary: "No previous interactions found",
          interactionCount: 0,
        }),
      };
    }

    const allSummaries = interactions
      .map((item) => item.Summary)
      .filter(Boolean)
      .join("\n\n");

    const summaryPrompt = `Please summarize the key points from these conversation summaries: ${allSummaries}`;

    const novaCommand = new InvokeModelCommand({
      modelId: "amazon.nova-micro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { text: summaryPrompt }, // Make each array item an object with 'text' property
            ],
          },
        ],
      }),
    });

    console.log("Invoking Bedrock for summary...");
    console.log(
      "Nova request:",
      JSON.stringify(
        {
          messages: [
            {
              role: "user",
              content: [summaryPrompt], // Content as array
            },
          ],
        },
        null,
        2
      )
    );

    const novaResponse = await bedrockClient.send(novaCommand);
    const responseBody = new TextDecoder().decode(novaResponse.body);
    console.log("Nova response:", responseBody);

    const parsedResponse = JSON.parse(responseBody);
    // const overallSummary =
      // parsedResponse.content?.[0]?.text || "No summary generated";
    const overallSummary = parsedResponse.output.message.content[0].text || "No summary generated";
    console.log("Overall summary:", overallSummary);
    console.log("Successfully generated summary");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        summary: overallSummary,
        interactionCount: interactions.length,
        lastInteraction: interactions[interactions.length - 1].Timestamp,
      }),
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: error.statusCode || 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
        errorDetails:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  }
};
