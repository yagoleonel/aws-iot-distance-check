import * as AWS from 'aws-sdk'
import { Context, DynamoDBStreamEvent } from 'aws-lambda';
import getDistance from 'geolib/es/getDistance';
import { VehicleToHandheldDAO } from '../dao/vehicle-to-handheld.dao';

const vehicleToHandheldDAO = new VehicleToHandheldDAO();

/**
 * Checks distance and sends event to SNS
 * @param event 
 * @param context 
 */
export const handler = async (event: DynamoDBStreamEvent, context?: Context): Promise<void> => {
  try {
    for (const record of event.Records) {
      if (record.dynamodb?.Keys) {
        const vehicleToHandheldKeys = AWS.DynamoDB.Converter.unmarshall(record.dynamodb?.Keys);

        const vehicleToHandheldData = await vehicleToHandheldDAO.getByVehicleMacAddress(vehicleToHandheldKeys.VehicleMacAddress);

        if (vehicleToHandheldData) {
          const vehiclePosition = vehicleToHandheldData.VehiclePosition;
          const handheldPosition = vehicleToHandheldData.HandheldPosition;
  
          const distance = getDistance({
            lat: vehiclePosition.latitude,
            lon: vehiclePosition.longitude
          },{
            lat: handheldPosition.latitude,
            lon: handheldPosition.longitude
          })
  
          console.log('DISTANCE', distance);
  
          if (distance > 50) {
            const event50mApartDelivery = {
              alertType: "50mApartDelivery",
              handheldId: vehicleToHandheldData.HandheldMacAddress,
              vehicleId: vehicleToHandheldData.VehicleMacAddress,
              latitude: vehiclePosition.latitude,
              longitude: vehiclePosition.longitude,
             }
             console.log(event50mApartDelivery);
          }
        }
      }
    }
    /// Todo: implement an object that sores the last updated items to avoid repetitive calls
  } catch (error) {
      console.error('vehicle-handheld-distance error:', error);
      throw error;
  }
};