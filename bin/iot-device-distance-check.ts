#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { IotDeviceDistanceCheckStack } from '../lib/iot-device-distance-check-stack';
import { IOTDistanceCheckPipelineStack } from '../lib/iot-pipeline-stack';

const app = new cdk.App();

/**
 * Stack deploy without pipeline
 */
// new IotDeviceDistanceCheckStack(app, 'IotDeviceDistanceCheckStack', {});

/**
 * Stack deploy with pipeline
 */
new IOTDistanceCheckPipelineStack(app, 'IOTPipeline', {})