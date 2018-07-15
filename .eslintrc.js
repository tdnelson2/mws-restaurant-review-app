module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 2015,
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            2
        ],
        "linebreak-style": 0,
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": [
            "error", {
                "allow": [
                    "log",
                    "error",
                    "warn"
                ]
            }
        ]
    }
};