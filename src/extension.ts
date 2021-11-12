/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
const { Client } = require("@notionhq/client");
require('dotenv').config();

const notion = new Client({
    auth: vscode.workspace.getConfiguration().get('vsc-blocks-notion.notionToken'),
});

const database_id = vscode.workspace.getConfiguration().get('vsc-blocks-notion.databaseId');

const add_api_page = async (name: string, code:string, language: string) => {
    if (name === '') {
        vscode.window.showErrorMessage('Please enter a name for the page');
        return;
    }
    if (code === '') {
        vscode.window.showErrorMessage('Please enter some code');
        return;
    }
    if (language === '') {
        vscode.window.showErrorMessage('Please enter a language');
        return;
    }
    const response = await notion.pages.create({
        parent: {
            database_id,
        },
        properties: {
            title: {
                title: [
                    {
                        text: {
                            content: name,
                        },
                    },
                ],
            },
            Tags: {
                multi_select: [
                    {
                    name: 'code-block',
                    },
                    {
                        name: language,
                    }
                ],
            },
        },
        children: [
            {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                  text: [
                    {
                      type: 'text',
                      text: {
                        content: name,
                      },
                    },
                  ],
                },
            },
            {
                "type": "code",
                "object": 'block',
                "code": {
                  "text": [{
                    "type": "text",
                    "text": {
                      "content": code
                    }
                  }],
                  "language": language
                }
              }
        ],
    });
    return response;
};

const FILETYPES:any = {
	"ts": "typescript",
	"tsx": "typescript",
	"js": "javascript",
	"py": "python",
	"html": "html",
	"rb": "ruby",
    "zshrc": "shell",
    "css": "css"
};

async function showInputBox() {

	const result: string | undefined = await vscode.window.showInputBox({
		value: '',
		placeHolder: 'Title of Page to be sent',
	});

	return result;
}


const logic = async (editor: vscode.TextEditor | undefined) => {
	try {
        let codeBlock: string | undefined = editor?.document.getText(editor.selection);
        	const filename: string[] | undefined = editor?.document.fileName.split('.');
        	const fileType: string | undefined = filename?.slice(-1)[0];
        
        
            if (codeBlock === undefined) {
                vscode.window.showErrorMessage('Please select some code');
                return;
            }
            if (fileType === undefined) {
                vscode.window.showErrorMessage('Please select a file');
                return;
            }
            const language = FILETYPES[fileType];
            if (language === undefined) {
                vscode.window.showErrorMessage('Please select a valid file');
                return;
            }
        
            const name = await showInputBox();
            if (name === undefined) {
                return;
            }
        
            const response = await add_api_page(name, codeBlock, language);
            return response.url;
    } catch (err) {
        console.error(err);
        return null;
    }
};


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vsc-blocks-notion" is now active!');

	let disposable = vscode.commands.registerCommand('vsc-blocks-notion.toNotion', async () => {
		const editor = vscode.window.activeTextEditor;
		const url = await logic(editor);
        if (url) {
		    vscode.window.showInformationMessage(`Created page successfully`, 'open page').then(async (value) => {
                if (value === 'open page') { 
                    vscode.env.openExternal(vscode.Uri.parse(url));
                }
            });
            
        } else {
            vscode.window.showErrorMessage('Could not create page -- check dev console');
        }
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
