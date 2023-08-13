import { Context, SQSEvent } from 'aws-lambda';
import { VehicleToHandheldDAO } from '../dao/vehicle-to-handheld.dao';

const vehicleToHandheldDAO = new VehicleToHandheldDAO();

/**
 * Checks whether the handheld is supposed to be tracked and updates it's position (latitude, longitude)
 * @param event 
 * @param context 
 */
export const handler = async (event: SQSEvent, context?: Context): Promise<void> => {
  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);

      const handHeldMacAddress = body.handheldId;

      const handHeldData = await vehicleToHandheldDAO.getByHandheldMacAddress(handHeldMacAddress);

      if (!handHeldData) {
        console.log(`NOT_FOUND: Handheld with id ${handHeldMacAddress} not found`);
        return;
      }

      if (new Date(body.timestamp) < new Date(handHeldData.HandheldPosition.lastUpdate)) {
        console.log(`OUTDATED: Handheld event outdated ${handHeldMacAddress}`);
        return;
      }

      handHeldData.HandheldPosition.lastUpdate = new Date().toISOString();

      await vehicleToHandheldDAO.updateHandheldPosition(handHeldData); /// TODO: pass only position here and not the entire object
    }
  } catch (error) {
      console.error('process-handheld-event error:', error);
      throw error;
  }
};