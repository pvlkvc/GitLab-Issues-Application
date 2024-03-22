# B3 Production

- [ ] check once for application webhook existing to avoid repeating, check upon config post
- [ ] idk if i can call session.config and only assign one username/rep_id at a time ? might need to do both at once ??
- [ ] login/register authentication differentiation; so it doesn't always require user to press authenticate (might need to remember token for that though)
- [ ] optimize repeating code
- [ ] add status checks in controller (is logged in, is configured...)
- [ ] maybe js in views works serverside?? like not inside the script tags?
- [ ] favicon missing ? check console log
- [ ] double check slashes in urls, if any urls are to be provided
- [ ] pretty sure get user info fetch doesn't actually need the token??

### CSS
- [ ] size responsitivity
- [ ] limit empty space (? i don't remember what this was)

### Creating web socket connections WITH user id

idea 1: pass identifier in url that web socket connects to - connect straight to user's websocket link
problem:  anyone could connect to web socket links and obtain data without authorizing
solution: introduce some sort of security check, like "are you really that person? prove it"
note: using git token would be technically a solution, but it does not sound secure to reuse it... also it is long, would take up space to store multiple tokens for sockets