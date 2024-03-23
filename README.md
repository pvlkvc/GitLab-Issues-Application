# B3 Production

- [x] check once for application webhook existing to avoid repeating, check upon config post
- [x?] idk if i can call session.config and only assign one username/rep_id at a time ? might need to do both at once ??
       ( ? possibly missed other instances, double check ? )
- [] add status checks in controller (is logged in, is configured...)
- [x] send webhook data for repo on a channel
- [x] webhook secret
- [] store auth token in cookies
- [x?] only send NEEDED data via websocket, don't include everything lol (? what is needed data, this might change)
- [] send response to webhook so it's not 500

- [] optimize repeating code
- [] placement of server-side js from views
- [] favicon missing ? check console log
- [] double check slashes in urls, if any urls are to be provided
- [] look into refreshing socket tokens
- [] include description preview/date in issue scroll?

- [o] login/register authentication differentiation; so it doesn't always require user to press authenticate (might need to remember token for that though)

### CSS
- [] size responsitivity
- [] limit empty space (? i don't remember what this was)
- [] issues: scroll long titles on hover? in issue scroll

### Creating web socket connections WITH user id

idea 1: pass identifier in url that web socket connects to - connect straight to user's websocket link
problem:  anyone could connect to web socket links and obtain data without authorizing
solution: introduce some sort of security check, like "are you really that person? prove it"
note: using git token would be technically a solution, but it does not sound secure to reuse it... also it is long, would take up space to store multiple tokens for sockets