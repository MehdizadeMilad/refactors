# Sample Refactors

Here are some of my Code Refactorings that I've done in my Code Reviews and Bug Fixing;

# [1.js](https://github.com/MehdizadeMilad/refactors/blob/master/1.js)
###### Problem: Data records would be overwritten if 80+ concurrent users were online simultaneously;
###### Solution: Keep data separated for each user
+ this change made our api able to serve more than 2000 users instead of ~100 users;
    
### Also: 
> Helper methods separated
> Bulk Create instead of loop Create in finishMatch()

To see the details, [click here](https://github.com/MehdizadeMilad/refactors/commit/e3be9624e51094c4642493237165a45ce8681543)  

---