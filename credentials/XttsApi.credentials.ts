import {
	ICredentialType,
	INodeProperties,
	ICredentialTestRequest,
} from 'n8n-workflow';

export class XttsApi implements ICredentialType {
	name = 'xttsApi';
	displayName = 'XTTS API';
	documentationUrl = 'https://github.com/nicolas/n8n-nodes-xtts';
	
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://xtts.nicolasdasilva.com.br/v1',
			description: 'The Base URL of your XTTS instance (e.g. https://xtts.nicolasdasilva.com.br/v1)',
		},
		{
			displayName: 'API Key (Bearer Token)',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'The API Key / Bearer token to access the XTTS API.',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.baseUrl}}',
			url: '/models',
			method: 'GET',
			headers: {
				Authorization: '=Bearer {{$credentials?.apiKey}}',
			},
		},
	};
}
