const VehicleData = {
  VehicleMacAddress: "0:2:0:1:63:4",
  HandheldMacAddress: "0:0:0:35:0:0",
  VehiclePosition: {
    latitude: 52.3780535,
    longitude: 4.8970233,
    lastUpdate: "2023-08-12T21:46:47.233Z"
  },
  HandheldPosition: {
    latitude: 52.3779372,
    longitude: 4.8968452,
    lastUpdate: "2023-08-12T21:46:47.233Z"
  }
};

import { processVehicleEventLambdaHandler } from '../../../src/lambdas'
import { SQSEvent } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { VehicleToHandheldDAO } from '../../../src/dao/vehicle-to-handheld.dao';

describe('process vehicle event', () => {
  it('should return as vehicle not found', async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: '12345',
          receiptHandle: 'handle',
          body: "{\"vehicleId\": \"HH:BB:BB:BB:02\",\"latitude\": 53.236545,\"longitude\": 5.693921,\"timestamp\": \"2022-10-10T16:45:39Z\"}",
          attributes: {
              ApproximateFirstReceiveTimestamp: new Date().toISOString(),
              ApproximateReceiveCount: new Date().toISOString(),
              SenderId: randomUUID(),
              SentTimestamp: new Date().toISOString()
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account-id:queue-name',
          awsRegion: 'region',
        },
      ],
    };

    const getByVehicleMacAddressSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'getByVehicleMacAddress').mockImplementation(() => Promise.resolve(undefined));
    const consoleLogSpy = jest.spyOn(console, 'log');

    await processVehicleEventLambdaHandler(event);

    expect(consoleLogSpy).toBeCalledWith("NOT_FOUND: Vehicle with id HH:BB:BB:BB:02 not found");
    consoleLogSpy.mockRestore();
    getByVehicleMacAddressSpy.mockRestore();
  });

  it('should return as outdated event', async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: '12345',
          receiptHandle: 'handle',
          body: "{\"vehicleId\": \"0:2:0:1:63:4\",\"latitude\": 53.236545,\"longitude\": 5.693921,\"timestamp\": \"2022-10-10T16:45:39Z\"}",
          attributes: {
              ApproximateFirstReceiveTimestamp: new Date().toISOString(),
              ApproximateReceiveCount: new Date().toISOString(),
              SenderId: randomUUID(),
              SentTimestamp: new Date().toISOString()
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account-id:queue-name',
          awsRegion: 'region',
        },
      ],
    };

    const getByVehicleMacAddressSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'getByVehicleMacAddress').mockImplementation(() => Promise.resolve(VehicleData));
    const consoleLogSpy = jest.spyOn(console, 'log');

    await processVehicleEventLambdaHandler(event);

    expect(consoleLogSpy).toBeCalledWith("OUTDATED: Vehicle event outdated 0:2:0:1:63:4");
    consoleLogSpy.mockRestore();
    getByVehicleMacAddressSpy.mockRestore();
  });  

  it('should update current vehicle position in dynamodb', async () => {
    const event: SQSEvent = {
      Records: [
        {
          messageId: '12345',
          receiptHandle: 'handle',
          body: "{\"vehicleId\": \"0:2:0:1:63:4\",\"latitude\": 53.236545,\"longitude\": 5.693921,\"timestamp\": \"2025-12-10T16:45:39Z\"}",
          attributes: {
              ApproximateFirstReceiveTimestamp: new Date().toISOString(),
              ApproximateReceiveCount: new Date().toISOString(),
              SenderId: randomUUID(),
              SentTimestamp: new Date().toISOString()
          },
          messageAttributes: {},
          md5OfBody: 'md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:region:account-id:queue-name',
          awsRegion: 'region',
        },
      ],
    };

    const getByVehicleMacAddressSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'getByVehicleMacAddress').mockImplementation(() => Promise.resolve(JSON.parse(JSON.stringify(VehicleData))));
    const updateVehiclePositionSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'updateVehiclePosition').mockImplementation(() => Promise.resolve());

    await processVehicleEventLambdaHandler(event);

    expect(updateVehiclePositionSpy).toHaveBeenCalledTimes(1);
    expect(new Date(updateVehiclePositionSpy.mock.calls[0][0].VehiclePosition.lastUpdate).getTime()).toBeGreaterThan(new Date(VehicleData.VehiclePosition.lastUpdate).getTime());
    updateVehiclePositionSpy.mockRestore();
    getByVehicleMacAddressSpy.mockRestore();
  });    
});
