import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({ region: "us-east-1" });

export const saveGame = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));

        // Parse the event body if it's coming from API Gateway
        const gameData = typeof event.body === 'string' 
            ? JSON.parse(event.body) 
            : event;

        console.log('Processed gameData:', JSON.stringify(gameData, null, 2));

        // Validate required fields
        const requiredFields = ['Name', 'Description', 'ImagePath'];
        const missingFields = requiredFields.filter(field => !gameData[field]);
        
        if (missingFields.length > 0) {
            console.log('Missing fields:', missingFields);
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

        const gameId = uuidv4();
        const timestamp = new Date().toISOString();

        // Prepare the item for DynamoDB
        const item = {
            Id: { S: gameId },
            Name: { S: gameData.Name },
            Description: { S: gameData.Description },
            ImagePath: { S: gameData.ImagePath },
            CreatedAt: { S: timestamp },
            UpdatedAt: { S: timestamp }
        };

        console.log('DynamoDB Item to be inserted:', JSON.stringify(item, null, 2));

        const command = new PutItemCommand({
            TableName: 'NPCForge_Game',  // Update this to match your table name
            Item: item
        });

        console.log('Sending PutItemCommand to DynamoDB');
        const result = await dynamoClient.send(command);
        console.log('DynamoDB Response:', JSON.stringify(result, null, 2));

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: true,
                gameId: gameId,
                message: "Game successfully created"
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
