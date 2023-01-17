# Replacing the Redis session storage and cache layer with Dynamo DB

## Summary
- Use a DynamoDB table to be the persistence layer for the session store instead of using a Redis store.
- To provide the same functionality as the Redis store wrt to;
  - providing a resilient storage layer for maintaining a distributed session cache
  - automatically deleting expired sessions
  - maintaining an index of active sessions by user so that all user's sessions are destroyed on global logout or when an account is deleted

## Decision
We will use Dynamo DB as the session storage layer in the express application.
We picked this option as it is simple, requiring replacing a pluggable dependency in the app.

The DynamoDB table will become part of the same stack along with and index (users sessions), with SSE enabled using a
KMS CMK.
The `users-sessions` index shall be indexed using the session's `user_id` value - which is `sub` from the user's userinfo. 
The table will have Point-in-time-recovery (PITR) disabled as sessions only last for 2 hours and will not need to be
recovered.
The Time-to-live (TTL) setting on each row will be driven by the session's `expires` epoch value.

The benefit of having a self-contained session storage layer built into the stack is that it removes the dependency of 
requiring a Redis cluster.
As the solution does not use Redis, the SSM parameter values (redis host, port, password) are no longer required and
thus no longer acquired by the application.
Currently, each AWS account in Accounts, has a Redis cluster stack that can be destroyed once no longer used.

The trade-off is that there is a Dynamo DB table been added to the stack.
Cache latency increases from sub-millisecond to 10's of milliseconds, however this delay shouldn't be perceptible to 
users.
It makes core functionality dependent on the AWS instead of just a Redis cluster.
Active sessions, held in Redis, will be lost when the stack is deployed and therefore should occur during a period of 
low usage.
The Redis cluster stacks can only be decommissioned once the AMF version without the dependency on Redis has been 
deployed.

## Other options considered
Keep the Redis cluster but this would go against the GDS technical strategy.
