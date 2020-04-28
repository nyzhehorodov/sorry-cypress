#! /usr/bin/env node

const spawn = require('child_process').spawn;
const hostile = require('hostile');

const wording = {
    noWindows: 'Sorry! Windows is not supported.',
    hostileSet: 'Updated /etc/hosts successfully.',
    hostileRemove: 'Removed ip from /etc/hosts successfully.',
    envNotSet: 'Please check your environment variable: '
}

const cypressCommand = [
    'run',
    '--record',
    '--parallel',
    '--key=' + process.env.SORRY_CYPRESS_RECORD_KEY,
    '--ci-build-id=' + process.env.SORRY_CYPRESS_BUILD_ID
];

// exit on windows
if (process.platform === 'win32') {
    console.error(wording.noWindows);
    process.exit(1);
}

// check env
[
    'SORRY_CYPRESS_RECORD_KEY',
    'SORRY_CYPRESS_API_IP',
    'SORRY_CYPRESS_BUILD_ID'
].forEach(key => {
    if (!process.env[key]) {
        console.error(wording.envNotSet + key);
        process.exit(1);
    }
});

// add hosts redirect
hostile.set(process.env.SORRY_CYPRESS_API_IP, 'api.cypress.io', error => {
    if (error) {
        console.error(error);
        process.exit(1);
    } else {
        console.log(wording.hostileSet);
    }
})

// spawn cypress process
cypressProcess = spawn('cypress', cypressArray, {
    stdio: 'inherit',
    shell: true
});

// handle close event
cypressProcess.on('close', code => {
    hostile.remove(process.env.SORRY_CYPRESS_API_IP, 'api.cypress.io', error => {
        if (error) {
            console.error(error);
            process.exit(1);
        } else {
            console.log(wording.hostileRemove);
        }
    });
});

// disable error handler
cypressProcess.on('error', () => null);

// pass signals from main process to cypress process
[
    'SIGHUP',
    'SIGINT',
    'SIGQUIT',
    'SIGTERM',
    'uncaughtException'
].forEach((eventType) => {
    process.on(eventType, () => cypressProcess.emit('error', {
        code: 1
    }));
});