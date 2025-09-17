// index.mjs

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ region: "us-east-1" });

export const saveNPC = async (event) => {
    try {
        // Parse the event body if it's coming from API Gateway
        const npcData = typeof event.body === 'string' 
            ? JSON.parse(event.body) 
            : event;

        // Validate required fields
        const requiredFields = [
            'GameId',
            'Backstory',
            'ExampleSpeech',
            'Gender',
            'Accent',
            'Information',
            'Name',
            'Description',
            'APIEvalPoint',
            'ImagePath'
        ];

        const missingFields = requiredFields.filter(field => !npcData[field]);
        if (missingFields.length > 0) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    success: false,
                    error: `Missing required fields: ${missingFields.join(', ')}`
                })
            };
        }

        const npcId = uuidv4();
        const timestamp = new Date().toISOString();

        // Prepare the item for DynamoDB
        const item = {
            Id: { S: npcId },
            GameId: { S: npcData.GameId },
            Backstory: { S: npcData.Backstory },
            ExampleSpeech: { S: npcData.ExampleSpeech },
            Gender: { S: npcData.Gender },
            Accent: { S: npcData.Accent },
            Information: { S: JSON.stringify(npcData.Information) },
            Name: { S: npcData.Name },
            Description: { S: npcData.Description },
            APIEvalPoint: { S: npcData.APIEvalPoint },
            ImagePath: { S: npcData.ImagePath },
            CreatedAt: { S: timestamp },
            UpdatedAt: { S: timestamp }
        };

        const command = new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE || 'NPCForge_NPC',
            Item: item
        });

        await dynamoClient.send(command);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                npcId: npcId,
                message: "NPC successfully created"
            })
        };

    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: error.statusCode || 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                error: error.message || 'An unexpected error occurred',
                errorDetails: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};