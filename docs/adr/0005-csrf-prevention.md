# CSRF Prevention  -- DRAFT

## Summary

We will protect our frontend from CSRF attacks by using a third party library. 

## Context

We currently use `csurf` which is a library provided by the ExpressJS team.  This library was deprectated a couple of years ago and is no longer being maintained.  There are various reports of insecurities in this library.  We therefore need to migrate to a new library.  Current candidates are `Helmet` and `csurf_csurf`.

The approach to CSRF adopted using the `csurf` library is the Double-submit Cookie pattern.  This is a stateless pattern but we have a session so we could use the Synchronizer Token Pattern instead.  This should be considered when evaluating the libraries below.

## Decision

### Use Helmet

### Use csrf_csrf

## Consequences

TBD
