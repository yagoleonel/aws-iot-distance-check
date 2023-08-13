import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import { IotDeviceDistanceCheckStack } from './iot-device-distance-check-stack';

export class IOTDistanceCheckPipelineAppStage extends cdk.Stage {

    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
      super(scope, id, props);

      const lambdaStack = new IotDeviceDistanceCheckStack(this, 'IotDeviceDistanceCheckStack');
    }
}