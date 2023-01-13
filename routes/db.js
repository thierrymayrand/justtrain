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
  JOIN ExerciceToWorkout ON UserCompletedWod.workoutId = ExerciceToWorkout.workoutId
  JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
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
    const excludedWodId = Array(1);
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
                    join exercicetoworkout on table1.workoutId = exercicetoworkout.workoutId
                    JOIN exercice ON exercicetoworkout.exerciceId = exercice.id
                    JOIN movement ON exercice.movementId = movement.id
                    GROUP BY table1.workoutId, modaliteId) as table2
                    group by table2.workoutId
                    having modalCount = 2
            ) as table3;`);
      
        count2modal = listCount2Modal[0][0].wodwith2modal
       

        const listCount3Modal = await promiseDb.query(`select count(*) as wodwith3modal from (
            select workoutId, count(*) as modalCount from (
            select table1.workoutId, modaliteId from (
                    select workoutId from
                    usercompletedwod
                    WHERE usercompletedwod.workoutId >= 205 and userId="${userId}"
                    limit 6) as table1
                    join exercicetoworkout on table1.workoutId = exercicetoworkout.workoutId
                    JOIN exercice ON exercicetoworkout.exerciceId = exercice.id
                    JOIN movement ON exercice.movementId = movement.id
                    GROUP BY table1.workoutId, modaliteId) as table2
                    group by table2.workoutId
                    having modalCount >= 3
            ) as table3;`);
        
        count3modal = listCount3Modal[0][0].wodwith3modal
        

        const listCount1Modal = await promiseDb.query(`select count(*) as wodwith1modal from (
            select count(*) as wodModalCount, id from (
            select table1.id, modaliteId from (
                    select * from
                    usercompletedwod
                    WHERE  userId="${userId}"
                    limit 6) as table1
                    join exercicetoworkout on table1.workoutId = exercicetoworkout.workoutId
                    JOIN exercice ON exercicetoworkout.exerciceId = exercice.id
                    JOIN movement ON exercice.movementId = movement.id
                    GROUP BY id, modaliteId
                    ) as table2
                    group by id
                    having wodModalCount = 1
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
                    join exercicetoworkout on workoutId = exercicetoworkout.workoutId
                    JOIN exercice ON exercicetoworkout.exerciceId = exercice.id
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
                     join exercicetoworkout on workoutId = exercicetoworkout.workoutId
                     JOIN exercice ON exercicetoworkout.exerciceId = exercice.id
                     JOIN movement ON exercice.movementId = movement.id
                     GROUP BY workoutId, modaliteId) as table2
                     group by table2.workoutId
                     having modalCount = 2
             ) as table3;`)
            
            wod2modal[0].forEach(function(row) {         
             excludedWodId.push(row.workoutId)     
         })
         
         }
}


async function getWod() {
    result = await promiseDb.query(`select workout.id as id, timeInSec, typeName as workoutType, rounds as numberOfRounds from workout
    JOIN workouttype on workoutTypeId = workouttype.id
    where  workoutTypeId != 3 AND workoutTypeId != 2 ORDER BY RAND() LIMIT 1;`)
    res.status(200).json(result[0][0])
}


    async function wait() {
         await  getModalCount()
         await exludeMissingEquipment()
         await getTimecount()
            console.log(`Count with 1 modal ${count1modal}`)
            console.log(`Count with 2 modal ${count2modal}`)
            console.log(`Count with 3 modal ${count3modal}`)
            console.log(`Count with 7 min under ${countminunder7}`)
            console.log(`Count with 15 min under ${countminunder15}`)
            console.log(`Count with 15 min over ${countminover15}`)
        await exludedWodLogic(count1modal = count1modal, count2modal = count2modal, count3modal = count3modal, countminunder7=countminunder7, countminunder15=countminunder15, countminover15 = countminover15)
       getWod()
    }
 
wait()
// ASYNC CODE ABOVE       
                });


                   

router.get('/getexercices', (req, res) => {
    const id = req.query.id
    db.query(`SELECT Exercice.id as id, rep, title, nomModal  FROM ExerciceToWorkout
    JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
    JOIN Movement ON movementId = Movement.id
    JOIN Modalite ON modaliteId = Modalite.id
    WHERE workoutId = ${id}`,
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
    const wodId = req.query.id.toString()
    db.query(` SELECT ExerciceToWorkout.id, equipmentName, CONCAT(rep, ' ', title) AS mainTitle FROM ExerciceToWorkout JOIN Exercice ON exerciceId = Exercice.id JOIN Movement ON movementId = Movement.id JOIN Equipment ON equipmentId = Equipment.id WHERE workoutId = ${wodId};`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        
    });
});

router.get('/finisher', (req, res) => {
    const wodId = req.query.id.toString()
    db.query(` SELECT ExerciceToWorkout.id, equipmentName, CONCAT(rep, ' ', title) AS mainTitle FROM ExerciceToWorkout JOIN Exercice ON exerciceId = Exercice.id JOIN Movement ON movementId = Movement.id JOIN Equipment ON equipmentId = Equipment.id WHERE workoutId = ${wodId};`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result)
        
    });
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


// CREATE NEW WORKOUT
router.post('/createwod', (req, res, next) => {
   // const userId = `${req.body.user.toString()}`
    // const workoutType = req.body.wodType
    const exercices = req.body.exercices
    const exercicesToJSON = JSON.parse(exercices)
    console.log(exercicesToJSON)
    const values = Array()
    res.status(200)
    // CREATE WORKOUT 

    // TAG WORKOUT TO USER
    exercicesToJSON.forEach(elem => {
        const item =`(${elem.rep}, ${elem.weight}, ${elem.movementId})`
        values.push(item)
    })
    string = values.join(",")
    console.log(string)
   
    // CREATE EXERCICES
    async function createExercice() {
        
        
        
        result = await promiseDb.query(`INSERT INTO exercice (rep, weight, movementId) VALUES ${string};`)
        res.status(200);
    }

     createExercice()

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

module.exports = router;