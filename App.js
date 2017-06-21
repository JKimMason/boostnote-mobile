import React, {Component} from 'react';
import {Text, Platform, Modal, View, TextInput} from 'react-native';
import {
    Container,
    Header,
    Title,
    Content,
    Button,
    Left,
    Right,
    Body,
    Icon,
    Drawer,
    Card,
    CardItem,
    Fab,
} from 'native-base';

import SideBar from './SideBar.js';
import NoteModal from './NoteModal';

import RNFetchBlob from 'react-native-fetch-blob';
const fs = RNFetchBlob.fs;
const dirs = RNFetchBlob.fs.dirs;

const MARKDOWN_NOTE = "MARKDOWN_NOTE";
const SNIPPET_NOTE = "SNIPPET_NOTE";
const DEFAULT_FOLDER = "DEFAULT_FOLDER";

export default class App extends Component {
    constructor() {
        super();
        this.state = {
            isNoteOpen: false,
            noteList: [],
            fileName: '',
            content: '',
        };
    }

    makeRandomHex() {
        var text = "";
        var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < 20; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    componentWillMount() {
        this.listDir(dirs.DocumentDir)
            .then((files) => {
                // Check whether the 'Boostnote' folder exist or not.
                const filteredFiles = files.filter((name) => {
                    return name === 'Boostnote';
                });
                // If not, create.
                if (filteredFiles.length === 0) {
                    this.createDir();
                }
                return this.listFiles();
            })
            .then((files) => {
                const filteredFiles = files.filter((name) => {
                    return name === 'boostnote.json';
                });
                // Check whether the folder has a setting file or not.
                if (filteredFiles.length === 0) {
                    // If not, create.
                    const defaultJson = {
                        note: []
                    };
                    fs.createFile(`${dirs.DocumentDir}/Boostnote/boostnote.json`, JSON.stringify(defaultJson), 'utf8')
                        .catch(err => console.log(err));
                }
                return this.listFiles();
            })
            .then((files) => {
                const filteredFiles = files.filter((name) => {
                    return name.endsWith('.md');
                });
                // Check whether the folder has any note files or not.
                if (filteredFiles.length === 0) {
                    // If not, create.
                    this.createNewNote('welcome.md');
                }
                return this.listFilesAndSetState();
            })
            .catch((err) => {
                console.log(err);
            });
    }

    openDrawer = () => {
        this._drawer._root.open();
    };

    setNoteModalIsOpen(fileName, isOpen) {
        console.log(fileName);
        fs.readFile(`${dirs.DocumentDir}/Boostnote/${fileName}`, 'utf8')
            .then((content) => {
                this.setState({
                    fileName: fileName,
                    content: content,
                    isNoteOpen: isOpen
                });
            });
    }

    listDir() {
        return RNFetchBlob.fs.ls(`${dirs.DocumentDir}`);
    }

    listFiles() {
        return RNFetchBlob.fs.ls(`${dirs.DocumentDir}/Boostnote`);
    }

    listFilesAndSetState() {
        this.listFiles(`${dirs.DocumentDir}/Boostnote`)
            .then((files) => {
                this.setState({
                    noteList: files
                });
            });
    }

    createDir() {
        RNFetchBlob.fs.mkdir(`${dirs.DocumentDir}/Boostnote`)
            .then(() => {
                console.log('OK');
            })
            .catch((err) => {
                console.log('NG');
            });
    }

    createNewNote(fileName) {
        const newFileName = fileName === '' ? `${this.makeRandomHex()}.md` : fileName;

        // Create a real file
        fs.createFile(`${dirs.DocumentDir}/Boostnote/${newFileName}`, '', 'utf8')
            .then((file) => {
                // Update setting file
                return fs.readFile(`${dirs.DocumentDir}/Boostnote/boostnote.json`, 'utf8')
            })
            .then((content) => {
                let contentObject = JSON.parse(content);
                const date = new Date();
                const thisNote = {
                    "type": MARKDOWN_NOTE,
                    "folder": DEFAULT_FOLDER,
                    "title": "",
                    "name": newFileName,
                    "isStarred": false,
                    "createdAt": date,
                    "updatedAt": date
                };
                contentObject.note.push(thisNote);
                console.table(contentObject.note);
                fs.createFile(`${dirs.DocumentDir}/Boostnote/boostnote.json`, JSON.stringify(contentObject), 'utf8')
                    .catch(err => console.log(err));
            })
            .catch((err) => {
                console.log(err);
            });
    }

    render() {
        return (
            <Drawer
                ref={(ref) => {
                    this._drawer = ref;
                }}
                content={<SideBar/>}
                panOpenMask={.05}>
                <Container>
                    <Header style={Platform.OS === 'android' ? {height: 70} : null}>
                        <Left style={Platform.OS === 'android' ? {top: 10} : null}>
                            <Button transparent onPress={this.openDrawer.bind(this)}>
                                <Icon name='menu'/>
                            </Button>
                        </Left>
                        <Body style={Platform.OS === 'android' ? {top: 10} : null}>
                        <Title>folder_name</Title>
                        </Body>
                        <Right style={Platform.OS === 'android' ? {top: 10} : null}>
                            <Button transparent>
                                <Icon name='search'/>
                            </Button>
                        </Right>
                    </Header>
                    <Content>
                        {
                            this.state.noteList.map((fileName) => {
                                return <Card key={fileName}>
                                    <CardItem button onPress={() => this.setNoteModalIsOpen(fileName, true)}>
                                        <Body>
                                        <Text>
                                            {fileName}
                                        </Text>
                                        </Body>
                                    </CardItem>
                                </Card>;
                            })
                        }
                    </Content>
                    <Fab
                        active={true}
                        containerStyle={{marginLeft: 10}}
                        style={{backgroundColor: '#5067FF'}}
                        position="bottomRight"
                        onPress={() => {
                            this.createNewNote('');
                            this.listFilesAndSetState();
                        }
                        }>
                        <Icon name="md-add"/>
                    </Fab>
                    <NoteModal setIsOpen={this.setNoteModalIsOpen.bind(this)}
                               isNoteOpen={this.state.isNoteOpen}
                               fileName={this.state.fileName}
                               content={this.state.content}/>
                </Container>
            </Drawer>
        );
    }
}