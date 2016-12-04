# Test automation challenge

This project is part of the 'Test Automation Without the Headache' workshop. It contains a simple web application with some horribly bad automated tests, and allows workshop participants to explore some better ways of automating tests.

The application allows two types of access - administrators can create user accounts and items, but cannot purchase anything. Regular users cannot create any items or accounts, but they can put items into a shopping cart, check out and top-up their balance. The orders will fail if users do not have enough money in their account. (Note the code is intentionally buggy, to demonstrate the effects of good tests).

## Prerequisites

* NodeJS (at least 4.3)

## Setting up

* run `npm install` to get all the dependencies

## Using the web app

* Run `npm start` to start the web application on https://localhost:3000.
* Sign in as the administrator, with the username `admin` and password `admin`.
* Create some user accounts in the web site -- the password will always be the same as the username.
* You can use the following test credit card numbers:

| expected outcome   | number           |
| Insufficient funds | 5555555555554444 | 
| Server is offline  | 4242424242424242 |
| Payment successful | 4000000000000077 |

## Running tests

Run all the tests: 

```
npm test
```

Run a subset of tests:

```
npm test -- filter='some part of the test name'
```

(note the space between `--` and `filter`).

For example, to execute all the tests containing the phrase `account balance` in the name, use the following command line:

```
npm test -- filter='account balance'
```
