import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { GLOBAL_CONSTANTS_CREDENTIALS_NAME, GlobalConstantsCredentialsData } from '../../credentials/GlobalConstantsCredentials.credentials';
import { splitConstants, setDeepValue } from '../../credentials/CredentialsUtils';


export class GlobalConstants implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Global Constants',
    name: 'globalConstants',
    // eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
    icon: 'file:globals-icon-60px.png',
    group: ['transform', 'output'],
    version: 1,
    description: 'Global Constants',
    subtitle: '={{$parameter["operation"]}}',
    defaults: {
      name: 'Global Constants',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: GLOBAL_CONSTANTS_CREDENTIALS_NAME,
        required: true,
      }
    ],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Global Constant',
            value: 'globalConstant',
          },
        ],
        default: 'globalConstant',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['globalConstant'],
          },
        },
        options: [
          {
            name: 'Get',
            value: 'get',
            description: 'Get global constants',
            action: 'Get global constants',
          },
          {
            name: 'Update',
            value: 'update',
            description: 'Update global constants',
            action: 'Update global constants',
          },
        ],
        default: 'get',
      },
      {
        displayName: 'Put All Constants in One Key',
        name: 'putAllInOneKey',
        type: "boolean",
        default: true,
        description: "Whether to put all constants in one key or use separate keys for each constant",
      },
      {
        displayName: "Constants Key Name",
        name: "constantsKeyName",
        type: "string",
        default: "constants",
        displayOptions: {
          show: {
            putAllInOneKey: [true],
          },
        },
      },
      {
        displayName: 'Starting Point',
        name: 'startingPoint',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['globalConstant'],
            operation: ['update'],
          },
        },
        options: [
          {
            name: 'Global Constants',
            value: 'globalConstants',
            description: 'Start with the constants from credentials',
          },
          {
            name: 'Empty Object',
            value: 'empty',
            description: 'Start with an empty object',
          },
        ],
        default: 'globalConstants',
      },
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        displayOptions: {
          show: {
            resource: ['globalConstant'],
            operation: ['update'],
          },
        },
        options: [
          {
            name: 'Add or Update Fields',
            value: 'updateFields',
          },
          {
            name: 'Set Entire JSON',
            value: 'setJson',
          },
        ],
        default: 'updateFields',
      },
      {
        displayName: 'JSON',
        name: 'json',
        type: 'json',
        displayOptions: {
          show: {
            resource: ['globalConstant'],
            operation: ['update'],
            mode: ['setJson'],
          },
        },
        default: '{}',
        description: 'The JSON object to set as constants',
      },
      {
        displayName: 'Fields to Update',
        name: 'fieldsToUpdate',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            resource: ['globalConstant'],
            operation: ['update'],
            mode: ['updateFields'],
          },
        },
        default: {},
        options: [
          {
            name: 'fields',
            displayName: 'Fields',
            values: [
              {
                displayName: 'Key',
                name: 'key',
                type: 'string',
                default: '',
                description: 'The key to set. Can be dot notation for nested fields (e.g. user.name).',
              },
              {
                displayName: 'Value',
                name: 'value',
                type: 'string',
                default: '',
                description: 'The value to set',
              },
            ],
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][] > {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials(GLOBAL_CONSTANTS_CREDENTIALS_NAME) as unknown as GlobalConstantsCredentialsData;
    const globalConstantsFromCreds = splitConstants(credentials.globalConstants);

    const iterationCount = items.length || 1;

    for (let i = 0; i < iterationCount; i++) {
      const resource = this.getNodeParameter('resource', i, 'globalConstant') as string;
      const operation = this.getNodeParameter('operation', i, 'get') as string;

      let constantsData : {[key: string]: any} = {};

      if (operation === 'get') {
        constantsData = { ...globalConstantsFromCreds };
      } else if (operation === 'update') {
        const startingPoint = this.getNodeParameter('startingPoint', i) as string;

        if (startingPoint === 'globalConstants') {
          // Deep copy to avoid modifying the base for other items
          constantsData = JSON.parse(JSON.stringify(globalConstantsFromCreds));
        }

        const mode = this.getNodeParameter('mode', i) as string;
        if (mode === 'setJson') {
          const json = this.getNodeParameter('json', i) as string | object;
          if (typeof json === 'string') {
            try {
              constantsData = JSON.parse(json);
            } catch (e) {
              constantsData = {};
            }
          } else {
            constantsData = json as {[key: string]: any};
          }
        } else {
          // updateFields
          const fieldsToUpdate = this.getNodeParameter('fieldsToUpdate', i, {}) as any;
          if (fieldsToUpdate.fields) {
            for (const field of fieldsToUpdate.fields) {
              const key = field.key as string;
              const value = field.value;
              setDeepValue(constantsData, key, value);
            }
          }
        }
      }

      const putAllInOneKey = this.getNodeParameter('putAllInOneKey', i) as boolean;
      let constantsToAdd: {[key: string]: any} = {};

      if (putAllInOneKey) {
        const constantsKeyName = this.getNodeParameter('constantsKeyName', i) as string;
        constantsToAdd = {
          [constantsKeyName]: constantsData,
        };
      } else {
        constantsToAdd = constantsData;
      }

      if (items.length === 0) {
        returnData.push({ json: constantsToAdd });
      } else {
        const item = items[i];
        returnData.push({
          ...item,
          json: {
            ...item.json,
            ...constantsToAdd,
          },
          pairedItem: {
            item: i,
          },
        });
      }
    }

    return [returnData];
  }
}
