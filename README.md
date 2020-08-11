# Sample Refactors

Here are some of my Code Refactorings that I've done in my Code Reviews and Bug Fixing;

- note that all Validations Removed
- Business need is written in comments

# [1.js](https://github.com/MehdizadeMilad/refactors/blob/master/1.js)

##### Problem: 
Data records would be overwritten if 80+ concurrent users were online simultaneously;

##### Solution:

Keep cache records separated for each user

- this change made our api able to serve more than 2000 users instead of ~100 users;

### Also:

- Helper methods separated
- Bulk Create instead of loop Create in finishMatch()

> To see details, [click here](https://github.com/MehdizadeMilad/refactors/commit/21a94cceb85b2011934d9890994829068a62b5b2)

---

# [2.js](https://github.com/MehdizadeMilad/refactors/blob/master/2.js)

- Refactor (Computed Property name)


#### sample :

```sh
let win_score =
    match.Player1Id === req.user.id ?
    (match.player1_score > match.player2_score ? 40 : 0) :
    (match.player2_score > match.player1_score ? 40 : 0);
```

#### Refactored :

```sh
let winScore = (match[`${thisPlayerNo}_score`] > match[`${opponentPlayerNo}_score`] ? 40 : 0);
```

> To see details, [click here](https://github.com/MehdizadeMilad/refactors/commit/8680c972af24add625df3462b5f6ae2fd38cb0ed)