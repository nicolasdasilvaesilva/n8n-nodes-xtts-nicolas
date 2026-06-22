import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IExecuteFunctions,
} from 'n8n-workflow';

import { OptionsWithUri } from 'request-promise-native';

export class Xtts implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'XTTS',
		name: 'xtts',
		icon: 'file:logo-dark.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Consume your XTTS API for Text-To-Speech',
		defaults: {
			name: 'XTTS',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'xttsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Audio',
						value: 'audio',
					},
				],
				default: 'audio',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [
							'audio',
						],
					},
				},
				options: [
					{
						name: 'Speech (Text-to-Speech)',
						value: 'speech',
						description: 'Convert text to speech',
						action: 'Convert text to speech',
					},
				],
				default: 'speech',
			},
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
				},
				default: '',
				description: 'The text to generate audio for.',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'audio',
						],
						operation: [
							'speech',
						],
					},
				},
			},
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'string',
				default: 'ana',
				description: 'The name of the voice (e.g., ana, will, adam). Make sure it is registered in your voice_to_speaker.yaml.',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'audio',
						],
						operation: [
							'speech',
						],
					},
				},
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: 'tts-1-hd',
				description: 'The model to use. For the new high quality XTTS voices, leave it as tts-1-hd.',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'audio',
						],
						operation: [
							'speech',
						],
					},
				},
			},
			{
				displayName: 'Put Output in Field',
				name: 'outputPropertyName',
				type: 'string',
				default: 'data',
				description: 'The name of the binary property to put the generated audio file in. Default is "data".',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'audio',
						],
						operation: [
							'speech',
						],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('xttsApi');

		if (!credentials || !credentials.baseUrl) {
			throw new NodeOperationError(this.getNode(), 'No credentials returned!');
		}

		const baseUrl = credentials.baseUrl as string;
		const apiKey = credentials.apiKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', 0) as string;
				const operation = this.getNodeParameter('operation', 0) as string;

				if (resource === 'audio' && operation === 'speech') {
					const text = this.getNodeParameter('text', i) as string;
					const voice = this.getNodeParameter('voice', i) as string;
					const model = this.getNodeParameter('model', i) as string;
					const outputPropertyName = this.getNodeParameter('outputPropertyName', i) as string;

					const options: OptionsWithUri = {
						headers: {
							'Content-Type': 'application/json',
						},
						method: 'POST',
						body: {
							model: model,
							input: text,
							voice: voice,
							response_format: 'mp3'
						},
						uri: `${baseUrl}/audio/speech`,
						json: true,
						encoding: null, // Required to get binary data
					};

					if (apiKey) {
						options.headers!['Authorization'] = `Bearer ${apiKey}`;
					}

					const responseData = await this.helpers.request(options);
					
					const binaryData = await this.helpers.prepareBinaryData(Buffer.from(responseData), 'audio.mp3', 'audio/mpeg');

					const newItem: INodeExecutionData = {
						json: items[i].json,
						binary: {
							[outputPropertyName]: binaryData,
						},
					};

					returnData.push(newItem);
				}
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
