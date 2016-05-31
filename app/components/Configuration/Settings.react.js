import React, {Component, PropTypes} from 'react';
import styles from './Settings.css';
import classnames from 'classnames';
import Select from 'react-select';

const DB_CREDENTIALS = [
    'username',
    'password',
    'portNumber'
];

const ENGINES = {
    MYSQL: 'mysql',
    SQLITE: 'sqlite',
    POSTGRES: 'postgres',
    MARIADB: 'mariadb',
    MSSQL: 'mssql'
};

const LOGOS = {
    POSTGRES: './images/postgresqlLogo.png',
    MYSQL: './images/mysqlLogo.png',
    MARIADB: './images/mariadbLogo.png',
    MSSQL: './images/mssqlLogo.png',
    SQLITE: './images/sqliteLogo.png'
};

const APP_STATUS = {
    INITIALIZED: 'INITIALIZED',
    ERROR: 'ERROR',
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED'
};

const BUTTON_MESSAGE = {
    INITIALIZED: 'connect',
    ERROR: 'try again',
    CONNECTED: 'connected',
    CONNECTING: 'connecting...',
    DISCONNECTED: 'connect'
};


export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDB: null,
            status: APP_STATUS.INITIALIZED
        };
    }

    componentWillReceiveProps(nextProps) {
        let status;

        if (nextProps.ipc.hasIn(['error', 'message'])) {
            status = APP_STATUS.ERROR;
        } else if (nextProps.ipc.get('databases')) {
            status = APP_STATUS.CONNECTED;
        } else if (!nextProps.ipc.get('databases')) {
            status = APP_STATUS.DISCONNECTED;
        }
        if (status) {
            this.setState({status});
        }
    }

    render() {
        const {ipcActions, configActions, configuration, ipc} = this.props;
        const {setValue} = configActions;

        let messageChooseEngine;
        if (this.state.selectedDB === null) {
            messageChooseEngine =
            <h5>Please select a database engine</h5>;
        } else {
            messageChooseEngine = <h5></h5>;
        }

        const logos = Object.keys(ENGINES).map(DB => (
            <div className={classnames(
                    styles.logo, {
                        [styles.logoSelected]: this.state.selectedDB === ENGINES[DB]
                    }
                )}
                onClick={() => {
                    this.setState({selectedDB: ENGINES[DB]});
                    setValue({
                        key: 'engine',
                        value: ENGINES[DB]
                    });
                }}
            >
                <img
                    className={styles.logoImage}
                    src={LOGOS[DB]}
                />
            </div>
        ));

        let inputs;
        if (this.state.selectedDB === ENGINES.SQLITE) {
            inputs =
                <input
                    placeholder="path to database"
                    type="text"
                    onChange={e => (
                        setValue({key: 'databasePath', value: e.target.value})
                    )}
                />;
        } else {
            inputs = DB_CREDENTIALS.map(credential => (
                <input
                    placeholder={credential}
                    type={credential === 'password' ? 'password' : 'text'}
                    onChange={e => (
                        setValue({key: credential, value: e.target.value})
                    )}
                />
            ));
        }

        const ipcDatabases = ipc.get('databases');
        let databaseDropdownOptions;
        if (ipcDatabases) {
            databaseDropdownOptions = ipcDatabases.toJS().map(database => (
                { value: database.Database, label: database.Database }
            ));
        } else {
            databaseDropdownOptions = [
                {value: 'None', label: 'None Found', disabled: true }
            ];
        }

        let successMessage = null;
        let errorMessage = null;
        let buttonMessage = BUTTON_MESSAGE[this.state.status];
        if (this.state.status === APP_STATUS.ERROR) {
            errorMessage = (
                <pre>
                    {
                        'Hm... there was an error connecting: ' +
                        ipc.getIn(['error', 'message'])
                    }
                </pre>
            );
            buttonMessage = BUTTON_MESSAGE[this.state.status];
        } else if (this.state.status === APP_STATUS.CONNECTED) {
            successMessage = (
                <pre>
                    {ipc.toJS().log}
                </pre>
            );
            buttonMessage = BUTTON_MESSAGE[this.state.status];
        } else if (this.state.status === APP_STATUS.LOADING) {
            buttonMessage = BUTTON_MESSAGE[this.state.status];
        } else if (this.state.status === APP_STATUS.DISCONNECTED) {
            successMessage = (
                <pre>
                    {ipc.toJS().log}
                </pre>
            );
            buttonMessage = BUTTON_MESSAGE[this.state.status];
        }

        const onClickDisconnect = () => {
            ipcActions.disconnect();
        };

        function onSelectDatabase(database) {
            setValue({key: 'database', value: database.value});
            ipcActions.useDatabase();
        }

        return (
            <div style={{width: '100%'}}>
                <h2>Configuration</h2>

                <div>
                    <div>
                        {messageChooseEngine}
                        {logos}
                    </div>
                </div>

                <div className={styles.inputContainer}>
                    {inputs}
                </div>

                <div className={styles.footer}>
                    <a className={styles.buttonPrimary}
                       onClick={() => {
                           this.setState({status: APP_STATUS.CONNECTING});
                           ipcActions.connect(configuration);
                       }}
                    >
                        {buttonMessage}
                    </a>
                    <a className={styles.buttonSecondary}
                       onClick={onClickDisconnect}
                    >
                        disconnect
                    </a>
                </div>

                <div className={styles.dropdown}>
                    <Select
                        name="form-field-name"
                        placeholder="Select Your Database"
                        options={databaseDropdownOptions}
                        onChange={onSelectDatabase}
                    />
                </div>

                {errorMessage}
                {successMessage}

                <hr/>
                log
                <pre>
                    {JSON.stringify(this.props.configuration.toJS())}
                </pre>
                tables
                <pre>
                    {JSON.stringify(this.props.ipc.toJS().tables, null, 2)}
                </pre>
                rows
                <pre>
                    {JSON.stringify(this.props.ipc.toJS().rows, null, 2)}
                </pre>

            </div>
        );
    }
}
