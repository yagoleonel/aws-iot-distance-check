import * as AWS from 'aws-sdk'
import { Context, DynamoDBStreamEvent } from 'aws-lambda';
import getDistance from 'geolib/es/getDistance';
import { Vehicle2Handheld } from '../../types/vehicle-to-handheld';

/**
 * Checks distance and sends event to SNS
 * @param event 
 * @param context 
 */
export const handler = async (event: DynamoDBStreamEvent, context?: Context): Promise<void> => {
  try {
    for (const record of event.Records) {
      if (record.dynamodb?.NewImage) {

        console.log('RECORD', JSON.stringify(record));

        const vehicleToHandheldData = AWS.DynamoDB.Converter.unmarshall(record.dynamodb?.NewImage) as Vehicle2Handheld;

        console.log('DATA', vehicleToHandheldData);

        const vehiclePosition = vehicleToHandheldData.VehiclePosition;
        const handheldPosition = vehicleToHandheldData.HandheldPosition;

        const distance = getDistance({
          lat: vehiclePosition.latitude,
          lon: vehiclePosition.longitude
        },{
          lat: handheldPosition.latitude,
          lon: handheldPosition.longitude
        })

        console.log('DISTAAAANCE', distance);

        if (distance > 50) {
          const event50mApartDelivery = {
            alertType: "50mApartDelivery",
            handheldId: vehicleToHandheldData.HandheldMacAddress,
            vehicleId: vehicleToHandheldData.VehicleMacAddress,
            latitude: vehiclePosition.latitude,
            longitude: vehiclePosition.longitude,
           }
          console.log('SEND EVENT TO SNS')
          console.log(event50mApartDelivery)
        }
      }
    }
  } catch (error) {
      console.error('vehicle-handheld-distance error:', error);
      throw error;
  }
};