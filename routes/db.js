const express = require('express');
const { query } = require('express');
const router = express.Router();

const mysql = require('mysql2')

let db;


    if (process.env.JAWSDB_URL) {
        db = mysql.createConnection(process.env.JAWSDB_URL);
        } else {
             db = mysql.createConnection({ 
                host: "eyvqcfxf5reja3nv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
                 user: "cj2s4bwby81owhj1",
                  password: "i66exp46tnb1wj1c",
                   database: "u3n248k3vnb52hku" 
                });
        }
        let promiseDb = db.promise()

db.connect(function(err) { 
    if (err) throw err;
    console.log("Connecte a la base de donne MySql!");
})
   

router.get('/allusers', (req, res, next) => { 
    db.query("SELECT * FROM appuser",
 function(err, result) {if (err) throw err;
    
     res.status(200).json(result)
      });
    });


router.get('/userworkouts', (req, res) => {
    const userId = req.query.id
   async function userWorkouts() {
    const result = await promiseDb.query(`SELECT id, workoutId, result, resultPercent, expectedResult, dateAndTime FROM usercompletedwod
    WHERE userId = "${userId}";`)
    console.log(result[0])
    res.status(200).json(result[0])
   } 
   userWorkouts()
   
})


router.get('/myworkouts', (req, res) => {
    const userId = req.query.id
   async function userWorkouts() {
    const result = await promiseDb.query(`select workout.id as id, timeInSec, rounds, typeName from workout 
    JOIN workouttype ON workoutTypeId = workouttype.id
    where userId = "${userId}";`)
    console.log(result[0])
    res.status(200).json(result[0])
   } 
   userWorkouts()
   
})

router.get('/allwod', (req, res) => {
    const userId = req.query.id
   async function userWorkouts() {
    const result = await promiseDb.query(`select workout.id as id, timeInSec, rounds, typeName from workout 
    JOIN workouttype ON workoutTypeId = workouttype.id
    WHERE workoutTypeId = 1 OR workoutTypeId=2;`)
    console.log(result[0])
    res.status(200).json(result[0])
   } 
   userWorkouts()
   
})

router.get('/completedwodcount', (req, res) => {
    const userId = req.query.id
   async function userWorkoutsCount() {
    const result = await promiseDb.query(`select  count(*) as wodCount from usercompletedwod
    where userId = "${userId}";`)
    console.log(result[0])
    res.status(200).json(result[0][0])
   } 
   userWorkoutsCount()
   
})


router.get('/exercices', (req, res, next) => { 
    db.query("SELECT * FROM Exercice",
 function(err, result) {if (err) throw err;
    
     res.status(200).json(result)
      });
    });

    // Create new user with uid -> POST 
router.post('/users', (req, res) => {
    
    const id = `${req.body.user.toString()}`
    const firstName = req.body.firstName
    const lastName = req.body.lastName
    const email = req.body.email
  db.query(`INSERT INTO appuser (id, firstName, lastName, email) VALUES ("${id}","${firstName}", "${lastName}", "${email}");`,function(err, result) {if (err) throw err;
    res.status(200)
  })
  
});

// GET THE CURRENT USER
router.get('/user', (req, res) => {
    const userId = req.query.id.toString()

    async function getUserInfo() {
        const result = await promiseDb.query(`SELECT * FROM appuser WHERE id = "${userId}";`)
        console.log(result[0])
        res.status(200).json(result[0][0])
       } 
       getUserInfo()
 
  
});

// GET EQUIPMENT FROM MOVEMENT
router.get('/equipfrommovement', (req, res) => {
    const movementId = req.query.id.toString()

    async function getMovementEquip() {
        const result = await promiseDb.query(`SELECT id, equipmentId FROM equipmenttomovement WHERE movementId = ${movementId};`)
        console.log(result[0])
        res.status(200).json(result[0])
       } 
       getMovementEquip()
 
  
});
 

// GET ALL MOVEMENT
router.get('/movements', (req, res) => {
    
    async function getAllMovement() {
        const result = await promiseDb.query(`SELECT * FROM movement;`)
        console.log(result[0])
        res.status(200).json(result[0])
       } 
       getAllMovement()
 
  
});

// GET ALL WORKOUT TYPES
router.get('/workouttype', (req, res) => {
    
    async function getAllWorkoutType() {
        const result = await promiseDb.query(`SELECT * FROM workouttype;`)
        res.status(200).json(result[0])
       } 
       getAllWorkoutType()
 
});

// GET THE MODALITY AVERAGE
router.get('/averagemodalite', (req, res) => {
    const userId = req.query.id

   

  db.query(`SELECT Modalite.id,  Modalite.nomModal, AVG(resultPercent) as averagePercent FROM UserCompletedWod 
  JOIN Exercice ON Exercice.workoutId = usercompletedwod.workoutId
  JOIN Movement ON Exercice.movementId = Movement.id
  JOIN Modalite ON Movement.modaliteID = Modalite.id
  WHERE userId = "${userId}"
  GROUP BY Movement.modaliteID
  ;`,
  function(err, result) {if (err) throw err;
    console.log(result)
    res.status(200).json(result)
  })
});

// Create a new User Workout item -> POST
router.post('/wodcompleted', (req, res, next) => {
    const dateAndTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    console.log(`date is ${dateAndTime}`)
    const userId = `${req.body.user.toString()}`
    const workoutId = `${req.body.workoutId.toString()}`
    const result = req.body.result
    const resultPercent = req.body.resultPercent
    const expectedResult = req.body.expectedResult
    
    db.query(`INSERT INTO UserCompletedWod  (workoutId, userId, result, resultPercent, expectedResult, dateAndTime) VALUES (${workoutId}, "${userId}", ${result}, ${resultPercent}, ${expectedResult}, "${dateAndTime}");`);
    
    console.log(req.body.user)
    res.status(300);
});



router.get('/workout', (req, res) => {
    const userId = req.query.id
    const gymId = req.query.gymId
    const excludedWodId = Array();
    var countminunder15 = 0
    var countminunder7 = 0
    var countminover15 = 0
    var count2modal = 0
    var count3modal = 0
    var count1modal = 0

    async function exludeMissingEquipment() {
        const exludedWod = await promiseDb.query(`SELECT workoutId FROM exercicetoworkout WHERE exerciceId IN (
            SELECT id as exerciceId FROM exercice WHERE movementId IN (
                SELECT movementId FROM equipmenttomovement WHERE equipmentId NOT IN (
                    SELECT equipmentId FROM equipmenttogym WHERE gymId = ${gymId}
                )
            )
        )
        GROUP BY workoutId;`)

        exludedWod[0].forEach(function(row) {         
            excludedWodId.push(row.workoutId)     
        })
        console.log(excludedWodId)
    }

    async function getModalCount() {
        const listCount2Modal = await promiseDb.query(`select count(*) as wodwith2modal from (
            select workoutId, count(*) as modalCount from (
            select table1.workoutId, modaliteId from (
                    select workoutId from
                    usercompletedwod
                    WHERE usercompletedwod.workoutId >= 205 and userId="${userId}"
                    limit 6) as table1
                    JOIN exercice ON table1.workoutId = exercice.workoutId
                    JOIN movement ON exercice.movementId = movement.id
                    GROUP BY table1.workoutId, modaliteId) as table2
                    group by table2.workoutId
                    having modalCount = 2
            ) as table3;`);
      
        count2modal = listCount2Modal[0][0].wodwith2modal
       console.log(`Modal 2 count is : ${count2modal}`)

        const listCount3Modal = await promiseDb.query(`select count(*) as wodwith2modal from (
            select workoutId, count(*) as modalCount from (
            select table1.workoutId, modaliteId from (
                    select workoutId from
                    usercompletedwod
                    WHERE usercompletedwod.workoutId >= 205 and userId="${userId}"
                    limit 6) as table1
                    JOIN exercice ON table1.workoutId = exercice.workoutId
                    JOIN movement ON exercice.movementId = movement.id
                    GROUP BY table1.workoutId, modaliteId) as table2
                    group by table2.workoutId
                    having modalCount >= 3
            ) as table3;`);
        
        count3modal = listCount3Modal[0][0].wodwith3modal
        

        const listCount1Modal = await promiseDb.query(`select count(*) as wodwith2modal from (
            select workoutId, count(*) as modalCount from (
            select table1.workoutId, modaliteId from (
                    select workoutId from
                    usercompletedwod
                    WHERE usercompletedwod.workoutId >= 205 and userId="${userId}"
                    limit 6) as table1
                    JOIN exercice ON table1.workoutId = exercice.workoutId
                    JOIN movement ON exercice.movementId = movement.id
                    GROUP BY table1.workoutId, modaliteId) as table2
                    group by table2.workoutId
                    having modalCount = 1
            ) as table3;  `);
        
        count1modal = listCount1Modal[0][0].wodwith1modal
       


    }

    async function getTimecount() {
        const countminunder15list = await promiseDb.query(`select count(*) as countwodunder15  from (
            select * from usercompletedwod
        where userId = '${userId}'
  order by dateAndTime desc
  limit 6
        ) as compWod
        join workout on workoutId = workout.id WHERE (expectedResult < 15 * 60  OR (timeInSec < 15 * 60 AND timeInSec != Null)) 
        ;`)

        countminunder15 = countminunder15list[0][0].countwodunder15

        const countminover15list = await promiseDb.query(`select count(*) as countwodover15  from (
            select * from usercompletedwod
        where userId = '${userId}'
  order by dateAndTime desc
  limit 6
        ) as compWod
        join workout on workoutId = workout.id WHERE (expectedResult >= 15 * 60  OR (timeInSec < 15 * 60 AND timeInSec != Null)) 
        ;`)

        countminover15 = countminover15list[0][0].countwodover15

        const countminunder7list = await promiseDb.query(`select count(*) as countwodunder7  from (
            select * from usercompletedwod
        where userId = '${userId}'
  order by dateAndTime desc
  limit 6
        ) as compWod
        join workout on workoutId = workout.id WHERE (expectedResult < 7 * 60  OR (timeInSec < 15 * 60 AND timeInSec != Null)) 
        ;`)
        
        
        countminunder7 = countminunder7list[0][0].countwodunder7
        
    
    }



    async function exludedWodLogic(count1modal, count2modal, count3modal, countminunder7, countminunder15, countminover15list) {
        if (count1modal >= 3) {
           const wod1modal = await promiseDb.query(`select * from (
             select workoutId, count(*) as modalCount from (
             select workoutId, modaliteId from (
                     select * from workout) as table1
                     JOIN exercice ON workoutId = exercice.workoutId
                     JOIN movement ON exercice.movementId = movement.id
                     GROUP BY workoutId, modaliteId) as table2
                     group by table2.workoutId
                     having modalCount = 1
             ) as table3;`)
           wod1modal[0].forEach(function(row) {         
            excludedWodId.push(row.workoutId)     
        })
        console.log(excludedWodId)
         console.log("above is the excluded wod")
        }
        if (count2modal >= 2) {
            const wod2modal = await promiseDb.query(`select * from (
                select workoutId, count(*) as modalCount from (
                select workoutId, modaliteId from (
                        select * from workout) as table1
                        JOIN exercice ON workoutId = exercice.workoutId
                        JOIN movement ON exercice.movementId = movement.id
                        GROUP BY workoutId, modaliteId) as table2
                        group by table2.workoutId
                        having modalCount = 2
                ) as table3;`)
            
            wod2modal[0].forEach(function(row) {         
             excludedWodId.push(row.workoutId)     
         })
         console.log(excludedWodId)
         console.log("above is the excluded wod")
         
         }
}


async function getWod() {
    result = await promiseDb.query(`select workout.id as id, timeInSec, typeName as workoutType, rounds as numberOfRounds from workout
    JOIN workouttype on workoutTypeId = workouttype.id
    where  workoutTypeId != 3 AND workoutTypeId != 5 AND workout.id NOT IN (${excludedWodId}) ORDER BY RAND() LIMIT 1;`)
    res.status(200).json(result[0][0])
}
async function getWodNoExclusion() {
    result = await promiseDb.query(`select workout.id as id, timeInSec, typeName as workoutType, rounds as numberOfRounds from workout
    JOIN workouttype on workoutTypeId = workouttype.id
    where  workoutTypeId != 3 AND workoutTypeId != 5 ORDER BY RAND() LIMIT 1;`)
    res.status(200).json(result[0][0])
}


    async function wait() {
         await  getModalCount()
      // await exludeMissingEquipment()
         await getTimecount()
            console.log(`Count with 1 modal ${count1modal}`)
            console.log(`Count with 2 modal ${count2modal}`)
            console.log(`Count with 3 modal ${count3modal}`)
            console.log(`Count with 7 min under ${countminunder7}`)
            console.log(`Count with 15 min under ${countminunder15}`)
            console.log(`Count with 15 min over ${countminover15}`)
        await exludedWodLogic(count1modal = count1modal, count2modal = count2modal, count3modal = count3modal, countminunder7=countminunder7, countminunder15=countminunder15, countminover15 = countminover15)
        console.log(`excludedwodId lenght is : ${excludedWodId.length}`)
        if (excludedWodId.length !== 0) {
            getWod()
        }
        else if (excludedWodId.length === 0) {
            getWodNoExclusion()
        }
       
    }
 
wait()
// ASYNC CODE ABOVE       
                });


                   

router.get('/getexercices', (req, res) => {
    const id = req.query.id
    db.query(`SELECT  exercice.id as id, rep, title, nomModal, weight  FROM exercice
    JOIN Movement ON movementId = Movement.id
    JOIN Modalite ON modaliteId = Modalite.id
    WHERE workoutId = ${id} ORDER BY indexId;`,
    function(err, result) { if (err) throw err; 
           
            console.log(result)
            res.status(200).json(result)
         })
})

router.get('/warmup', (req, res) => {
    let warmUpId = 0
    
    db.query(`Select workout.id, rounds, timeInSec, typeName as workoutType FROM workout 
    JOIN workouttype ON workoutTypeId = workouttype.id
    WHERE workoutTypeId = 3
    ORDER BY RAND()
    LIMIT 1;`,
    function(err, result) {if (err) throw err;
        warmUpId = result[0].id
        console.log(warmUpId)
        
        res.status(200).json(result[0])
        
    });
});

router.get('/skill', (req, res) => {
    let skillId = 0
    
    db.query(`Select workout.id, rounds as numberOfRounds, timeInSec, typeName as workoutType FROM workout 
    JOIN workouttype ON workoutTypeId = workouttype.id
    WHERE workoutTypeId = 5
    ORDER BY RAND()
    LIMIT 1;`,
    function(err, result) {if (err) throw err;
        skillId = result[0].id
        console.log(`skill id is ${skillId}`)
        
        res.status(200).json(result[0])
        
    });
});


router.get('/finisher', (req, res) => {
    const wodId = req.query.id.toString()
    db.query(` SELECT ExerciceToWorkout.id, equipmentName, CONCAT(rep, ' ', title) AS mainTitle FROM ExerciceToWorkout JOIN Exercice ON exerciceId = Exercice.id JOIN Movement ON movementId = Movement.id JOIN Equipment ON equipmentId = Equipment.id WHERE workoutId = ${wodId};`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        
    });
});

router.get('/getplannings', (req, res) => {
    const userId = req.query.userId
    db.query(`SELECT * FROM logplanning;`,
    function(err, result) {if (err) throw err;
        console.log(result)
        res.status(200).json(result)
        
    });
});

router.get('/workoutexpectedscore', (req, res) => {
    const workoutId = req.query.id
    let workoutType = 0
    const rounds = 0
    const timeInSec = 0
    
    async function getWorkoutType() {
        const result = await promiseDb.query(`SELECT * FROM workout WHERE id = ${workoutId};`)
        workoutType = result[0][0].workoutTypeId
        console.log(workoutType)


        if (workoutType == 1) {
            async function getExpectedTime() {
                const result = await promiseDb.query(`select rounds * (select SUM(totalTimeInSec) as totalTimePerRound FROM (
                    select rep, timeInSec, rep * timeInSec as totalTimeInSec from exercice 
                   JOIN movement ON movementId = movement.id
                   where workoutId = ${workoutId}
                   ) as table1) as totalTimeInSec
                   from workout where id = ${workoutId};`) 
                   res.status(200).json(result[0][0])
            }
            getExpectedTime()
           }
    
           if (workoutType == 2) {
            async function getExpectedRounds() {
                const result = await promiseDb.query(`SELECT timeInSec / (select SUM(totalTimeInSec) as totalTimePerRound FROM (
                    select rep, timeInSec, rep * timeInSec as totalTimeInSec from exercice 
                   JOIN movement ON movementId = movement.id
                   where workoutId = ${workoutId}
                   ) as table1) as totalRounds 
                   from workout where id = ${workoutId};`) 
                   res.status(200).json(result[0][0])
            }
            getExpectedRounds()
        }
        
       } 
       getWorkoutType()
       
       
  
});

router.get('/warmupfrommodal', (req, res) => {
    modalId = req.query.id.toString()
    db.query(` SELECT * FROM WarmUp WHERE modaliteId=${modalId} LIMIT 1;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log("Le warm up est:", result)
        
    });
});

router.get('/skillfrommodal', (req, res) => {
    modalId = req.query.id.toString()
    db.query(` SELECT * FROM Workout WHERE modaliteId=${modalId} LIMIT 1;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log("Le wod est:", result)
        
    });
});

router.get('/wodfrommodal', (req, res) => {
    modalId = req.query.id.toString()
    db.query(` SELECT * FROM Workout WHERE modaliteId=${modalId} LIMIT 1;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log("Le wod est:", result)
        
    });
});

router.get('/allequipmenttype', (req, res) => {
    
    db.query(`SELECT title AS id FROM equipmenttype ;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log("Les type d'equipements sont", result)
        
    });
});

router.get('/equipfromtype', (req, res) => {
    typeTitle = req.query.type
    db.query(`select equipment.id, equipment.title from equipmenttotype 
    JOIN equipment ON equipmentId = equipment.id
    where equipmentType = "${typeTitle}";`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log("Les equipements sont", result)
        
    });
});

router.get('/finisherfrommodal', (req, res) => {
    modalId = req.query.id.toString()
    db.query(` SELECT * FROM Workout WHERE modaliteId=${modalId} LIMIT 1;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log("Le wod est:", result)
        
    });
});


router.get('/modalite', (req, res) => {
    const userId = req.query.id.toString()
    db.query(`SELECT Modalite.id FROM AppUser JOIN JourMatrice ON jourMatriceId = JourMatrice.id JOIN Modalite ON JourMatrice.modaliteId = Modalite.id WHERE AppUser.id = "${userId}" LIMIT 1;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log(result)
        
    });
});

router.get('/movement', (req, res) => {
    const movementId = req.query.id.toString()
    db.query(`SELECT * FROM movement WHERE id = ${movementId};`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log(result)
        
    });
});

router.get('/wodfunctions', (req, res) => {
    wodId = req.query.id.toString()
    db.query(`SELECT Functions.functionName as id, SUM(rep) as totalRep FROM ExerciceToWorkout
    JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
    JOIN Movement ON movementId = Movement.id
    JOIN Modalite ON modaliteId = Modalite.id
    JOIN MovementFunction ON Movement.id = MovementFunction.movementId
    JOIN Functions ON MovementFunction.functionId = Functions.id
    WHERE workoutId = ${wodId}
    GROUP BY functionName
     ;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        console.log("Resultats functions", result)
        
    });
});

router.get('/modalrepetition', (req, res) => {
    wodId = req.query.id.toString()
    db.query(` SELECT nomModal as id, SUM(rep) as totalRep FROM ExerciceToWorkout
    JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
    JOIN Movement ON movementId = Movement.id
    
    JOIN Modalite ON modaliteId = Modalite.id
    JOIN MovementFunction ON Movement.id = MovementFunction.movementId
    JOIN Functions ON MovementFunction.functionId = Functions.id
    WHERE workoutId = ${wodId}
    GROUP BY nomModal
     ;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
       
    });
});


router.get('/getexpectedtime', (req, res) => {
    wodId = req.query.id
    db.query(`SELECT exerciceTime * (SELECT Workout.rounds AS numberOfRounds FROM ExerciceToWorkout
        JOIN Workout ON ExerciceToWorkout.workoutId = Workout.id
        WHERE workoutId = ${wodId} LIMIT 1) as expectedTime  FROM (
         SELECT SUM( Movement.timeInSec * Exercice.rep) as exerciceTime FROM ExerciceToWorkout
        JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
        JOIN Workout ON ExerciceToWorkout.workoutId = Workout.id
        JOIN Movement ON movementId = Movement.id
        WHERE workoutId = ${wodId}
        ) as myTable 
         ;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result[0].expectedTime)
       
        
    });
});

// Create a new User Workout item -> POST
router.post('/creategym', (req, res, next) => {
    const userId = `${req.body.user.toString()}`
    const gymName = req.body.gymName
    const equipments = req.body.equipments
    db.query(`INSERT INTO gym (gymName) VALUES ("${gymName}")`, (err, result, fields) => {
        if (err) console.log(err.message)
        else {
            const gymId = result.insertId
            db.query(`INSERT INTO usertogym (userId, gymId) VALUES ("${userId}", ${gymId});`, (err, result, fields) => {
                if (err) console.log(err.message)
                else {
                    res.status(300);
                    const values = equipments.map (x => `(${x}, ${gymId})`).join (', ');
                    db.query(`INSERT INTO equipmenttogym (equipmentId, gymId) VALUES ${values}; `)
                }
            })
        }
    });
    
    
    
});

// LOG RESULTS FROM CHATGPT
router.post('/logplanning', (req, res, next) => {
    const userId = req.body.userId
    const planning = req.body.planning
    const prompt = req.body.prompt
    db.query(`INSERT INTO logplanning (userId, planning, prompt) VALUES ("${userId}", "${planning}", "${prompt}")`, (err, result, fields) => {
        if (err) console.log(err.message)
        else {
            res.status(200)
        }
    });
    
    
    
});


// CREATE NEW WORKOUT
router.post('/createwod', (req, res, next) => {
   // const userId = `${req.body.user.toString()}`
    // const workoutType = req.body.wodType
    const exercices = req.body.exercices
    const exercicesToJSON = JSON.parse(exercices)
    const wodType = req.body.wodType
    const rounds = req.body.rounds
    const min = req.body.min
    const userId = req.body.userId
    
    const values = Array()
    res.status(200)
 
    // CREATE WORKOUT 

    async function createWod() {
        wod = await promiseDb.query(`INSERT INTO workout (userId,rounds, workoutTypeId, timeInSec) VALUES (${userId} ,${rounds}, ${wodType}, ${min} );`)
        res.status(200);
        console.log(wod)
        //const wodId = wod.insertId
        //console.log(wodId)
    }

    db.query(`INSERT INTO workout (userId,rounds, workoutTypeId, timeInSec) VALUES ("${userId}", ${rounds}, ${wodType}, ${min} );`, (err, result, fields) => {
        if (err) console.log(err.message)
        else {
            const wodId = result.insertId
            console.log(wodId)
            exercicesToJSON.forEach(elem => {
                const item =`( ${elem.id},${elem.rep}, ${elem.weight}, ${elem.movementId}, ${wodId})`
                values.push(item)
            })
            string = values.join(",")

            db.query(`INSERT INTO exercice ( indexId,rep, weight, movementId, workoutId) VALUES ${string};`, (err, result, fields) => {
                if (err) console.log(err.message)
                else {
                    res.status(300);
                }
            })
        }
    });

    // TAG WORKOUT TO USER
    
     // CREATE EXERCICES
    
   
   
   
    async function createExercice() {
        result = await promiseDb.query(`INSERT INTO exercice (rep, weight, movementId, workoutId) VALUES ${string};`)
        res.status(200);
    }

     

    // TAG EVERY EXERCICE TO WORKOUT 

});



// Add user to sept deniers gym-> POST
router.post('/addseptdeniers', (req, res, next) => {
    const userId = req.body.userId
            db.query(`INSERT INTO usertogym (userId, gymId) VALUES ("${userId}", 1);`, (err, result, fields) => {
                if (err) console.log(err.message)
                else {
                    res.status(300);
                }
            })
});

// LIKE WORKOUT POST
router.post('/likewod', (req, res, next) => {
    const userId = req.body.userId
    const wodId = req.body.wodId
            db.query(`INSERT INTO likedworkout (userId, workoutId) VALUES ("${userId}", ${wodId});`, (err, result, fields) => {
                if (err) console.log(err.message)
                else {
                    res.status(300);
                }
            })
});
// GET LIKED WOD FOR USER
router.get('/likedwod', (req, res) => {
    const userId = req.query.id.toString()

    async function getLikedWod() {
        const result = await promiseDb.query(`SELECT workoutId as id FROM likedworkout WHERE userId = "${userId}";`)
        console.log(result[0])
        res.status(200).json(result[0])
       } 
       getLikedWod()
 
  
});

// GET LIKED WOD FOR USER
router.get('/resultgroupbyfuncandmodal', (req, res) => {
    const userId = req.query.id.toString()

    async function getResults() {
        const result = await promiseDb.query(`select AVG(resultPercent) * 100 as avgResult, functionId, functions.title, modaliteId, modalite.nomModal from usercompletedwod
        JOIN Exercice ON Exercice.workoutId = usercompletedwod.workoutId
       JOIN Movement ON Exercice.movementId = Movement.id
       JOIN movementfunctions ON Exercice.movementId = movementfunctions.movementId
       JOIN functions ON functionId = functions.id
       JOIN Modalite ON Movement.modaliteID = Modalite.id
       where userId="${userId}"
       GROUP BY functionId, modaliteId
       ORDER BY  avgResult;`)
        console.log(result[0])
        res.status(200).json(result[0])
       } 
       getResults()
 
  
});


// GET THE CURRENT USER
router.get('/allgym', (req, res) => {
    const userId = req.query.id
 
  db.query(`select gymId as id, gymName from usertogym
  JOIN gym on gymId = gym.id WHERE userId = "${userId}";`, (err, result, fields) => {
    if (err) console.log(err.message)
    else {
    console.log(result)
    res.status(200).json(result)
  }
   })
});

router.get('/equipfromgym', (req, res) => {
    const userId = req.query.id
 
  db.query(`select equipment.id as id, title from equipmenttogym 
  JOIN equipment on equipmentId = equipment.id
  where gymId = ${userId};`, (err, result, fields) => {
    if (err) console.log(err.message)
    else {
    console.log(result)
    res.status(200).json(result)
  }
   })
});

router.get('/workoutinfo', (req, res) => {
    const wodId = req.query.id
    db.query(`SELECT workout.id as id, timeInSec, typeName as workoutType, rounds as numberOfRounds FROM workout
    JOIN workouttype on workoutTypeId = workouttype.id
    WHERE workout.id = ${wodId};`, (err, result, fields) => {
        if (err) console.log(err.message)
        else {
            res.status(200).json(result[0])
        }
    })
})



const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config();
const apiKey = process.env.OPENAI_API_KEY;


router.get('/chatcompletion', async (req, res) => {
    
    const inputString =  req.query.inputString;
    console.log("Input string" + " " + inputString)
    const configuration = new Configuration({
        apiKey: apiKey,
      });
      const openai = new OpenAIApi(configuration);
    try {
        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{role: "system", content: `Tu es le meilleure entraineur de crossfit au monde. Tu donne des programme d'entrainement clair et detailler. 
            Je veux un calendrier d'exercices avec 7 jours par semaine  d'entrainement. 
            Tout les jours il faut au moins 5 exercises. J'ai acces seulement a une salle de crossfit. Oublie pas de me donner le details pour chaques exercices`},
            {"role": "user", "content": `${inputString}`}
        ],
          });
        const message = completion.data.choices[0].message
        console.log(message)
        res.status(200).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



module.exports = router;