
import { DynamoDBStreamEvent } from 'aws-lambda';
import { calcVehicleHandheldDistanceLambdaHandler } from '../../../src/lambdas'
import { VehicleToHandheldDAO } from '../../../src/dao/vehicle-to-handheld.dao';

const dynamoDBStreamEventMock: DynamoDBStreamEvent = {
    Records: [{
        eventID: '1c0366d8ba1b73583933cf4327fd00f3',
        eventName: 'MODIFY',
        eventVersion: '1.1',
        eventSource: 'aws:dynamodb',
        awsRegion: 'eu-central-1',
        dynamodb: {
            ApproximateCreationDateTime: 1691926286,
            Keys: {
                VehicleMacAddress: {
                    S: '0:0:0:0:0:0'
                },
                HandheldMacAddress: {
                    S: '74:0:86:0:0:0'
                }
            },
            SequenceNumber: '2974700000000010680290777',
            SizeBytes: 302,
            StreamViewType: 'KEYS_ONLY'
        },
        eventSourceARN: 'arn:aws:dynamodb:eu-central-1:305637164144:table/Vehicle2HandheldTable/stream/2023-08-12T19:59:12.863'
    }],
}

describe('calc distance between vehicle and handheld', () => {
    it ('should log the data to be sent to SNS', async () => {
        const event50mApartDelivery = {
            alertType: "50mApartDelivery",
            handheldId: '74:0:86:0:0:0',
            vehicleId: '0:0:0:0:0:0',
            latitude: 52.3781094,
            longitude: 4.8966216,
        }

        const retrieveData = {
            VehicleMacAddress: '0:0:0:0:0:0',
            HandheldMacAddress: '74:0:86:0:0:0',
            HandheldPosition: {
                lastUpdate: '2023-08-14T07:25:45.013Z',
                latitude: 52.9993999,
                longitude: 4.9990999
            },
            VehiclePosition: {
                lastUpdate: '2023-08-14T09:10:44.181Z',
                latitude: 52.3781094,
                longitude: 4.8966216
            }
        };

        const getByVehicleMacAddressSpy = jest.spyOn(VehicleToHandheldDAO.prototype, 'getByVehicleMacAddress').mockImplementation(() => Promise.resolve(retrieveData));
        const consoleLogSpy = jest.spyOn(console, 'log');

        await calcVehicleHandheldDistanceLambdaHandler(dynamoDBStreamEventMock);

        expect(consoleLogSpy).toBeCalledWith(event50mApartDelivery)
        consoleLogSpy.mockRestore();
        getByVehicleMacAddressSpy.mockRestore();
    })
})