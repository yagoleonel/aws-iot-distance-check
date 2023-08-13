const handheldData = {
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
  
  import { processHandheldEventLambdaHandler } from '../../../src/lambdas'
  import { SQSEvent } from 'aws-lambda'; // Import the SQSEvent type
  import { randomUUID } from 'crypto';
  import { VehicleToHandheldDAO } from '../../../src/dao/vehicle-to-handheld.dao';
  
  describe('process handheld event', () => {
    it('should return as handheld not found', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: '12345',
            receiptHandle: 'handle',
            body: "{\"handheldId\": \"HH:BB:BB:BB:02\",\"latitude\": 53.236545,\"longitude\": 5.693921,\"timestamp\": \"2022-10-10T16:45:39Z\"}",
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
  
      const getByHandheldMacAddressSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'getByHandheldMacAddress').mockImplementation(() => Promise.resolve(undefined));
      const consoleLogSpy = jest.spyOn(console, 'log');
  
      await processHandheldEventLambdaHandler(event);
  
      expect(consoleLogSpy).toBeCalledWith("NOT_FOUND: Handheld with id HH:BB:BB:BB:02 not found");
      consoleLogSpy.mockRestore();
      getByHandheldMacAddressSpy.mockRestore();
    });
  
    it('should return as outdated event', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: '12345',
            receiptHandle: 'handle',
            body: "{\"handheldId\": \"0:2:0:1:63:4\",\"latitude\": 53.236545,\"longitude\": 5.693921,\"timestamp\": \"2022-10-10T16:45:39Z\"}",
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
  
      const getByHandheldMacAddressSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'getByHandheldMacAddress').mockImplementation(() => Promise.resolve(handheldData));
      const consoleLogSpy = jest.spyOn(console, 'log');
  
      await processHandheldEventLambdaHandler(event);
  
      expect(consoleLogSpy).toBeCalledWith("OUTDATED: Handheld event outdated 0:2:0:1:63:4");
      consoleLogSpy.mockRestore();
      getByHandheldMacAddressSpy.mockRestore();
    });  
  
    it('should update current handheld position in dynamodb', async () => {
      const event: SQSEvent = {
        Records: [
          {
            messageId: '12345',
            receiptHandle: 'handle',
            body: "{\"handheldId\": \"0:2:0:1:63:4\",\"latitude\": 53.236545,\"longitude\": 5.693921,\"timestamp\": \"2025-12-10T16:45:39Z\"}",
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
  
      const getByHandheldMacAddressSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'getByHandheldMacAddress').mockImplementation(() => Promise.resolve(JSON.parse(JSON.stringify(handheldData))));
      const updateHandheldPositionSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'updateHandheldPosition').mockImplementation(() => Promise.resolve());
  
      await processHandheldEventLambdaHandler(event);
  
      expect(updateHandheldPositionSpy).toHaveBeenCalledTimes(1);
      expect(new Date(updateHandheldPositionSpy.mock.calls[0][0].HandheldPosition.lastUpdate).getTime()).toBeGreaterThan(new Date(handheldData.HandheldPosition.lastUpdate).getTime());
      updateHandheldPositionSpy.mockRestore();
      getByHandheldMacAddressSpy.mockRestore();
    });    
  });
  