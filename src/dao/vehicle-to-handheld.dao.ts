import * as AWS from 'aws-sdk';
import { Vehicle2Handheld } from '../../types/vehicle-to-handheld';

export class VehicleToHandheldDAO {
    tableName: string;
    handheldIndexName: string | undefined;
    dynamodb = new AWS.DynamoDB.DocumentClient();

    constructor () {
      this.tableName = process.env.VECHICLE_2_HANDHELD_TABLE_NAME!;
      this.handheldIndexName = process.env.HANDHELD_INDEX_NAME;
    }

    async getByHandheldMacAddress (handheldMacAdress: string): Promise<Vehicle2Handheld | undefined> {
        const params = {
          TableName: this.tableName,
          IndexName: this.handheldIndexName,
          KeyConditionExpression: 'HandheldMacAddress = :sortKey',
          ExpressionAttributeValues: { ':sortKey': handheldMacAdress },
        };
      
        try {
          const result = await this.dynamodb.query(params).promise();
          return result.Items ? result.Items[0] as Promise<Vehicle2Handheld> : undefined;
        } catch (error) {
          console.error('Error querying by HandheldMacAddress:', error);
          throw error;
        }
    }

    async getByVehicleMacAddress (vechicleMacAdress: string): Promise<Vehicle2Handheld | undefined> {
      const params = {
          TableName: this.tableName,
          KeyConditionExpression: 'VehicleMacAddress = :vechicleMacAdress',
          ExpressionAttributeValues: { ':vechicleMacAdress': vechicleMacAdress },
        };
      
        try {
          const result = await this.dynamodb.query(params).promise();
          return result.Items ? result.Items[0] as Promise<Vehicle2Handheld> : undefined;
        } catch (error) {
          console.error('Error querying with primary key:', error);
          throw error;
        }
    }    

    async updateVehiclePosition (vehicleData: Vehicle2Handheld): Promise<void> {
      const position = vehicleData.VehiclePosition;
      const primaryKey = vehicleData.VehicleMacAddress;
      const sortKey = vehicleData.HandheldMacAddress;

      try {
        await this.doUpdatePosition({ primaryKey, sortKey, position, field: 'VechiclePosition' })
      } catch (error) {
        console.error('Error updating vehicle position', error);
        throw error;
      }
    }

    async updateHandheldPosition (handheldData: Vehicle2Handheld): Promise<void> {
      const position = handheldData.HandheldPosition;
      const primaryKey = handheldData.VehicleMacAddress;
      const sortKey = handheldData.HandheldMacAddress;
      
      try {
        await this.doUpdatePosition({ primaryKey, sortKey, position, field: 'HandheldPosition' })
      } catch (error) {
        console.error('Error updating handheld position', error);
        throw error;
      }
    }

    async doUpdatePosition({ primaryKey, sortKey, position, field }: { primaryKey: string, sortKey: string, position: Record<string, any>, field: string }): Promise<void> {
      const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
        TableName: this.tableName,
        Key: { VehicleMacAddress: primaryKey, HandheldMacAddress: sortKey }, // Primary key
        UpdateExpression: `SET ${field} = :position`,
        ExpressionAttributeValues: {
          ':position': JSON.stringify(position),
        },
      };
      await this.dynamodb.update(params).promise();
    }
}