import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class IotDeviceDistanceCheckStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //DynamoDB table
    const vehicle2HandheldTable = new dynamodb.Table(this, 'Vehicle2HandheldTable', {
      tableName: 'Vehicle2HandheldTable',
      partitionKey: {
        name: 'VehicleMacAddress',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'HandheldMacAddress',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.KEYS_ONLY,
    });
    
    // GSI HandheldMacAddress
    vehicle2HandheldTable.addGlobalSecondaryIndex({
      indexName: 'HandheldMacIndex',
      partitionKey: {
        name: 'HandheldMacAddress',
        type: dynamodb.AttributeType.STRING,
      },
    });
    // DynamoDB table policy
    const vehicle2HandheldTableDynamoPolicy = new iam.Policy(this, 'vehicle2HandheldTableDynamoPolicy', {
      policyName: 'vehicle2HandheldTableDynamoPolicy',
      statements:[ 
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:Query',
            'dynamodb:UpdateItem',
          ],
          resources: [vehicle2HandheldTable.tableArn]
        })
      ]
    })
    // DynamoDB table policy
    const vehicle2HandheldTableDynamoIndexPolicy = new iam.Policy(this, 'vehicle2HandheldTableDynamoIndexPolicy', {
      policyName: 'vehicle2HandheldTableDynamoIndexPolicy',
      statements:[ 
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:Query',
          ],
          resources: [`${vehicle2HandheldTable.tableArn}/index/HandheldMacIndex`]
        })
      ]
    })    
    // DynamoDB table stream policy
    const vehicle2HandheldTableDynamoStreamPolicy = new iam.Policy(this, 'vehicle2HandheldTableDynamoStreamPolicy', {
      policyName: 'vehicle2HandheldTableDynamoStreamPolicy',
      statements:[ 
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:GetRecords',
          ],
          resources: [vehicle2HandheldTable.tableStreamArn!],
        })
      ]
    });

    // Vehicle dead letter queue
    const checkVehicleDistanceQueueDLQ = new sqs.Queue(this, 'CheckVehicleDistanceQueueDLQ', {
      queueName: 'CheckVehicleDistanceQueueDLQ',
    });
    // Vehicle queue
    const checkVehicleDistanceQueue = new sqs.Queue(this, 'CheckVehicleDistanceQueue', {
      queueName: 'CheckVehicleDistanceQueue',
      deadLetterQueue: {
        queue: checkVehicleDistanceQueueDLQ,
        maxReceiveCount: 3
      }
    });
    // Vehicle queue policy
    const checkVehicleDistanceSQSPolicy =  new iam.Policy(this, 'checkVehicleDistanceSQSPolicy', {
      policyName: 'checkVehicleDistanceSQSPolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'sqs:ReceiveMessage'
          ],
          resources: [checkVehicleDistanceQueue.queueArn]
        })
      ]
    })
    // Vehicle process event lambda
    const processVehicleEventLambda = new lambda.Function(this, 'processVehicleEventLambda', {
      code: lambda.Code.fromAsset('dist/'),
      handler: 'src/lambdas/process-vehicle-event.handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        VECHICLE_2_HANDHELD_TABLE_NAME: vehicle2HandheldTable.tableName
      }
    });
    processVehicleEventLambda.role?.attachInlinePolicy(checkVehicleDistanceSQSPolicy);
    processVehicleEventLambda.role?.attachInlinePolicy(vehicle2HandheldTableDynamoPolicy);
    processVehicleEventLambda.addEventSource(new cdk.aws_lambda_event_sources.SqsEventSource(checkVehicleDistanceQueue));


    // Handheld dead letter queue
    const checkHandheldDistanceQueueDLQ = new sqs.Queue(this, 'CheckHandheldDistanceQueueDLQ', {
      queueName: 'CheckHandheldDistanceQueueDLQ',
    });
    // Handheld queue
    const checkHandheldDistanceQueue = new sqs.Queue(this, 'CheckHandheldDistanceQueue', {
      queueName: 'CheckHandheldDistanceQueue',
      deadLetterQueue: {
        queue: checkHandheldDistanceQueueDLQ,
        maxReceiveCount: 3
      }
    });
    // Handheld queue policy
    const checkHandheldDistanceSQSPolicy =  new iam.Policy(this, 'checkHandheldDistanceSQSPolicy', {
      policyName: 'checkHandheldDistanceSQSPolicy',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'sqs:ReceiveMessage'
          ],
          resources: [checkHandheldDistanceQueue.queueArn]
        })
      ]
    });
    // Vehicle process event lambda
    const processHandheldEventLambda = new lambda.Function(this, 'processHandheldEventLambda', {
      code: lambda.Code.fromAsset('dist/'),
      handler: 'src/lambdas/process-handheld-event.handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        VECHICLE_2_HANDHELD_TABLE_NAME: vehicle2HandheldTable.tableName,
        HANDHELD_INDEX_NAME: 'HandheldMacIndex'
      }
    });
    processHandheldEventLambda.role?.attachInlinePolicy(checkHandheldDistanceSQSPolicy);
    processHandheldEventLambda.role?.attachInlinePolicy(vehicle2HandheldTableDynamoPolicy);
    processHandheldEventLambda.role?.attachInlinePolicy(vehicle2HandheldTableDynamoIndexPolicy);
    processHandheldEventLambda.addEventSource(new cdk.aws_lambda_event_sources.SqsEventSource(checkHandheldDistanceQueue));

    // Vehicle process event lambda
    const calcVehicleHandheldDistanceLambda = new lambda.Function(this, 'calcVehicleHandheldDistanceLambda', {
      code: lambda.Code.fromAsset('dist/'),
      handler: 'src/lambdas/calc-vehicle-handheld-distance.handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      retryAttempts: 2
    });
    calcVehicleHandheldDistanceLambda.role?.attachInlinePolicy(checkHandheldDistanceSQSPolicy);
    calcVehicleHandheldDistanceLambda.role?.attachInlinePolicy(vehicle2HandheldTableDynamoPolicy);
    calcVehicleHandheldDistanceLambda.role?.attachInlinePolicy(vehicle2HandheldTableDynamoStreamPolicy);
    calcVehicleHandheldDistanceLambda.addEventSource(new cdk.aws_lambda_event_sources.DynamoEventSource(vehicle2HandheldTable, {
      startingPosition: lambda.StartingPosition.TRIM_HORIZON,
    }));
  }
}
