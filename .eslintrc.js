module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 8
    },
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "windows"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": [
            "error",
            {
                "allow": [
                    "warn"
                ]
            }
        ]
    },
    "globals": {
        "ko": false,
        "module": false,
        "google": false,
        "$": false
    }
};
