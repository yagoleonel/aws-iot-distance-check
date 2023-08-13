import { Context, SQSEvent } from 'aws-lambda';
import { VehicleToHandheldDAO } from '../dao/vehicle-to-handheld.dao';

const vehicleToHandheldDAO = new VehicleToHandheldDAO();

/**
 * Checks whether the vahicle is supposed to be tracked and updates it's position (latitude, longitude)
 * @param event 
 * @param context 
 */
export const handler = async (event: SQSEvent, context?: Context): Promise<void> => {
  try {
    for (const record of event.Records) {
      const body = JSON.parse(record.body);

      const vehicleMacAddress = body.vehicleId;

      const vehicleData = await vehicleToHandheldDAO.getByVehicleMacAddress(vehicleMacAddress);

      if (!vehicleData) {
        console.log(`NOT_FOUND: Vehicle with id ${vehicleMacAddress} not found`);
        return;
      }

      if (new Date(body.timestamp) < new Date(vehicleData.HandheldPosition.lastUpdate)) {
        console.log(`OUTDATED: Vehicle event outdated ${vehicleMacAddress}`);
        return;
      }

      vehicleData.VehiclePosition.lastUpdate = new Date().toISOString();

      await vehicleToHandheldDAO.updateVehiclePosition(vehicleData);
    }
  } catch (error) {
      console.error('process-vehicle-event error:', error);
      throw error;
  }
};