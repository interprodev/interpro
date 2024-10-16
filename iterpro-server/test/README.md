## prerequisite-1

Prior to test, create a database named 'iterpro_test' and copy in './test/db/iterpro_test/'. This is the dump of the testing db.
'iterpro_test' should contain bson files generated from a mongodump command.

## prerequisite-2

To run the test cases... go to server app '~/iterproserver' and run following command...
'npm run executeTest'

=============================
ORDER of test case execution
=============================

1=> token.test.js
2=> test-runner.js
Now the order will be defines in the file 'test-runner.js' for all the services to be tested inside after() hook.
