
import { DynamoDBStreamEvent } from 'aws-lambda';
import { calcVehicleHandheldDistanceLambdaHandler } from '../../../src/lambdas'

const dynamoDBStreamEventMock: DynamoDBStreamEvent = {
    Records: [{
        eventID: '1c0366d8ba1b73583933cf4327fd00f3',
        eventName: 'INSERT',
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
            NewImage: {
                VehiclePosition: {
                    M: {
                        latitude: {
                            N: '52.377735447258196'
                        },
                        lastUpdate: {
                            S: '2023-08-12T21:46:47.231Z'
                        },
                        longitude: {
                            N: '4.897365985806916'
                        }
                    }
                },
                HandheldPosition: {
                    M: {
                        latitude: {
                            N: '52.37842481955316'
                        },
                        lastUpdate: {
                            S: '2023-08-12T21:46:47.231Z'
                        },
                        longitude: {
                            N: '4.897072283895077'
                        }
                    }
                },
                VehicleMacAddress: {
                    S: '0:0:0:0:0:0'
                },
                HandheldMacAddress: {
                    S: '74:0:86:0:0:0'
                }
            },
            SequenceNumber: '2974700000000010680290777',
            SizeBytes: 302,
            StreamViewType: 'NEW_AND_OLD_IMAGES'
        },
        eventSourceARN: 'arn:aws:dynamodb:eu-central-1:305637164144:table/Vehicle2HandheldTable/stream/2023-08-12T19:59:12.863'
    }],
}

describe('calc distance between vehicle and handheld', () => {

    it ('should send data to SNS', () => {
        const event50mApartDelivery = {
            alertType: "50mApartDelivery",
            handheldId: '74:0:86:0:0:0',
            vehicleId: '0:0:0:0:0:0',
            latitude: 52.377735447258196,
            longitude: 4.897365985806916,
        }

        const consoleLogSpy = jest.spyOn(console, 'log');

        calcVehicleHandheldDistanceLambdaHandler(dynamoDBStreamEventMock);
        expect(consoleLogSpy).toBeCalledWith("SEND EVENT TO SNS");
        expect(consoleLogSpy).toBeCalledWith(event50mApartDelivery)
        consoleLogSpy.mockRestore();
    })
})