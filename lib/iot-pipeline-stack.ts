import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { IOTDistanceCheckPipelineAppStage } from './iot-pipeline-stage';

export class IOTDistanceCheckPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'IOTDistanceCheckPipeline',
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('yagoleonel/aws-iot-distance-check', 'main'),
        commands: ['npm install', 'npm run test', 'npm run package', 'npx cdk synth']
      })
    });

    pipeline.addStage(new IOTDistanceCheckPipelineAppStage(this, "IOTPipelineAppStage"));
  }
}