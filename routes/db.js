const express = require('express');
const router = express.Router();

const mysql = require('mysql')

let db;

if (process.env.JAWSDB_URL) {
db = mysql.createConnection(process.env.JAWSDB_URL);
} else {
     db = mysql.createConnection({ 
        host: "localhost",
         user: "admin",
          password: "thierry90",
           database: "fitland" 
        });
}


db.connect(function(err) { 
    if (err) throw err;
    console.log("Connecte a la base de donne MySql!");
})
   /*
for (let step = 0; step < 10; step++) {
    // Runs 5 times, with values of step 0 through 4.
    const workoutId = step + 38
    const rounds = Math.floor(Math.random() * 4) + 2;
    db.query(`INSERT INTO ExerciceToWorkout (exerciceId, workoutId)  SELECT Exercice.id, ${workoutId} FROM Exercice
    JOIN Movement ON movementId = Movement.id
    JOIN Equipment ON equipmentId = Equipment.id
    WHERE Equipment.id = 3 OR Equipment.id = 5
    ORDER BY RAND () 
    LIMIT 3
    ;`)
  }
  */

  /*
for (let step = 0; step < 5; step++) {
    // Runs 5 times, with values of step 0 through 4.
    
    db.query(`INSERT INTO Workout(workoutType, numberOfRounds) VALUES ("FOR TIME", ${rounds});`)
  }
*/

router.get('/allusers', (req, res, next) => { 
    db.query("SELECT * FROM users",
 function(err, result) {if (err) throw err;
    
     res.status(200).json(result)
      });
    });

router.get('/exercices', (req, res, next) => { 
    db.query("SELECT * FROM Exercice",
 function(err, result) {if (err) throw err;
    
     res.status(200).json(result)
      });
    });

    // Create new user with uid -> POST 
router.post('/user', (req, res, next) => {
    const query = 4
    const id = `${req.body.user.toString()}`
    const userName = req.body.userName
    const lastName = req.body.lastName
    const email = req.body.email
  console.log(req.body.user)
  db.query(`INSERT INTO AppUser (id, userName, lastName, email) VALUES ("${id}","${userName}", "${lastName}", "${email}");`)
  res.status(300)
});

// GET THE CURRENT USER
router.get('/user', (req, res) => {
    const userId = req.query.id.toString()
 
  db.query(`SELECT * FROM AppUser WHERE id = "${userId}";`,
  function(err, result) {if (err) throw err;
    res.status(200).json(result[0])
  })
});
 

// GET THE MODALITY AVERAGE
router.get('/averagemodalite', (req, res) => {
    const userId = req.query.id.toString()
 
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
    const userId = `${req.body.user.toString()}`
    const workoutId = `${req.body.workoutId.toString()}`
    const result = req.body.result
    const resultPercent = req.body.resultPercent
    const expectedResult = req.body.expectedResult
    db.query(`INSERT INTO UserCompletedWod  (workoutId, userId, result, resultPercent, expectedResult) VALUES (${workoutId}, "${userId}", ${result}, ${resultPercent}, ${expectedResult});`);
    
    console.log(req.body.user)
    res.status(300);
});


router.get('/workout', (req, res) => {
    const modalite = []
    const last2Workout = []
    const workouts = []
   
    db.query(`SELECT COUNT(*) as workoutCount FROM UserCompletedWod WHERE userId = "1";`, (err, result) => {
        if (err) console.log(err.message)
        else console.log("Workout count of the user is " + result[0].workoutCount)
        const workoutCount = parseInt(result[0].workoutCount)
        if(workoutCount >= 2)  {
            console.log("equal to 2 or greater")
            db.query(`SELECT * FROM UserCompletedWod WHERE userId = "1" LIMIT 2;`, (err, result, fields) => {
                if (err) console.log(err.message)
                else {
                    Object.keys(result).forEach(function(key) {
                        var row = result[key];
                       
                        last2Workout.push(row)
                       
                      });
                  
                    db.query(`SELECT modalite, COUNT(*) as modaliteCount  FROM (
                        SELECT DISTINCT Workout.id as workoutId, Modalite.nomModal as modalite
                         FROM ExerciceToWorkout
                        JOIN Workout ON ExerciceToWorkout.workoutId = Workout.id 
                        JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
                        JOIN Movement ON Exercice.movementId = Movement.id
                        JOIN Modalite ON Movement.modaliteID = Modalite.id
                        
                        WHERE workoutId = ${last2Workout[0].workoutId}
                        UNION ALL 
                        SELECT DISTINCT Workout.id as workoutId, Modalite.nomModal as modalite
                         FROM ExerciceToWorkout
                        JOIN Workout ON ExerciceToWorkout.workoutId = Workout.id 
                        JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
                        JOIN Movement ON Exercice.movementId = Movement.id
                        JOIN Modalite ON Movement.modaliteID = Modalite.id
                        WHERE workoutId = ${last2Workout[1].workoutId}
                        ) as AllModalite
                        GROUP BY modalite
                        HAVING modaliteCount >= 2
                        ;`, (err, result, fields) => {
                        if (err) console.log(err.message)
                        else {
                            Object.keys(result).forEach(function(key) {
                                var row = result[key];
                               
                                modalite.push(row.modalite)
                                console.log(row)
                               
                               
                              });
                             
                              db.query(`SELECT * FROM Workout WHERE id NOT IN ( 
                                SELECT workoutId FROM ExerciceToWorkout
                                JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
                                JOIN Movement ON Exercice.movementId = Movement.id
                                JOIN Modalite ON Movement.modaliteID = Modalite.id
                                WHERE nomModal IN ("Gymnastic")
                                GROUP BY workoutId)
                                ORDER BY RAND() LIMIT 1
                                ;`, (err, result) => {
                                if (err) throw err
                                else {
                                    console.log(result)
                                    res.status(200).json(result[0])
                                }
                              })
                           
                            
                        }
                    })
                }
            })
            
        } else {
            console.log("lower than 2")
        }
    })
  
});

router.get('/getexercices', (req, res) => {
    const id = req.query.id
    db.query(`SELECT Exercice.id as id, rep, title, equipmentName, nomModal  FROM ExerciceToWorkout
        JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
        JOIN Movement ON movementId = Movement.id
        JOIN Equipment ON equipmentId = Equipment.id
        JOIN Modalite ON modaliteId = Modalite.id
        WHERE workoutId = ${id};`,
    function(err, result) { if (err) throw err; 
           
            console.log(result)
            res.status(200).json(result)
         })
})

router.get('/warmup', (req, res) => {
    let warmUpId = 0
    
    db.query(` Select * FROM Workout WHERE Workout.id NOT IN (SELECT workoutId FROM ExerciceToWorkout
        JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
        JOIN Movement ON movementId = Movement.id
        JOIN Equipment ON equipmentId = Equipment.id
        WHERE equipmentId != 3 AND equipmentId != 5
        GROUP BY workoutId)
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
    JOIN Equipment ON equipmentId = Equipment.id
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
    JOIN Equipment ON equipmentId = Equipment.id
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
    wodId = req.query.id.toString()
    db.query(`SELECT exerciceTime * (SELECT Workout.numberOfRounds AS numberRounds FROM ExerciceToWorkout
        JOIN Workout ON ExerciceToWorkout.workoutId = Workout.id
        WHERE workoutId = 20 LIMIT 1) as expectedTime  FROM (
         SELECT SUM( Movement.timeInSec * Exercice.rep) as exerciceTime FROM ExerciceToWorkout
        JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
        JOIN Workout ON ExerciceToWorkout.workoutId = Workout.id
        JOIN Movement ON movementId = Movement.id
        JOIN Equipment ON equipmentId = Equipment.id
        WHERE workoutId = ${wodId}
        ) as myTable 
         ;`,
    function(err, result) {if (err) throw err;
        res.status(200).json(result[0].expectedTime)
       
        
    });
});

module.exports = router;