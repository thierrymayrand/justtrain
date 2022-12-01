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
   

router.get('/allusers', (req, res, next) => { 
    db.query("SELECT * FROM appuser",
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
 
  db.query(`SELECT * FROM appuser WHERE id = "${userId}";`, (err, result, fields) => {
    if (err) console.log(err.message)
    else {
    console.log(result)
    res.status(200).json(result[0])
  }
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
    const userId = req.body.id
    const excludedWodId = Array();
    var last6under15min = 0
    var countwodunder7 = 0
    var countover15 = 0
    var count2modal = 0
    var count3moremodal = 0
    var count1modal = 0

    db.query(`select count(*) as wodwith2modal from (
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
        ) as table3;`, (err, result, fields) => {
            if (err) console.log(err.message)
            else {
                count2modal = result[0].wodwith2modal
                console.log(`count with 2 modal ${count2modal}`)

                db.query(`select count(*) as wodwith3moremodal from (
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
                    ) as table3;`, (err, result, fields) => {
                        if (err) console.log(err.message)
                        else {
                            count3moremodal = result[0].wodwith3moremodal
                            console.log(`count with 3 modal or more ${count3moremodal}`)
            
                            db.query(`select count(*) as wodwith1modal from (
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
                                        having modalCount = 1
                                ) as table3;`, (err, result, fields) => {
                                    if (err) console.log(err.message)
                                    else {
                                        console.log(result)
                                        count1modal = result[0].wodwith1modal
                                        console.log(`count with 1 modal ${count1modal}`)
                        
                                       
                                    }
                            })
                        }
                })
            }
    })
    db.query(`select workoutId from (
        select workoutId, count(*) as modalCount from workout 
        JOIN exercicetoworkout ON workout.id = exercicetoworkout.workoutId
        JOIN exercice ON exercicetoworkout.exerciceId = exercice.id
        JOIN movement ON exercice.movementId = movement.id
        GROUP BY workoutId, modaliteId
        HAVING modalCount IN (select * from (
        select modalityCount from (
        select count(*) as timesOfOccurance, modalityCount as modalityCount from (
        select count(*) as modalityCount from (select workoutId, modaliteId from exercicetoworkout 
        JOIN exercice on exercicetoworkout.exerciceId = exercice.id
        JOIN movement on exercice.movementId = movement.id
        where workoutId IN (
        select * from (
        select workoutId from usercompletedwod
        WHERE workoutId >= 205 and userId="tHV0mtFjkCfZMuEJ59qfdYvhPlO2"
        limit 6
        ) as workoutscompletedbyuser
        )
        group by workoutId, modaliteId) as table2
        group by workoutId
        ) as modalitycountperworkout
        
        group by modalityCount
        ) as newTable
        where (modalityCount = 1 
        and timesOfOccurance >=2) 
        or  (modalityCount = 2 
        and timesOfOccurance >=3) or (modalityCount = 3 and timesOfOccurance >=2)
        )as modalitieToExclude) 
        )as derivedTable;`,  (err, result, fields) => {

            if (err) console.log(err.message)
            else {
                result.forEach(function(row) {
                    
                    excludedWodId.push(row.workoutId)
                })
                console.log(excludedWodId)
                db.query(`select count(*) as countwodunder15 from usercompletedwod
                join workout on workoutId = workout.id
                WHERE workoutId >= 205 and userId="tHV0mtFjkCfZMuEJ59qfdYvhPlO2" and timeInSec < 15 * 60
                limit 6;`, (err, result, fields) => {
                    if (err) console.log(err.message)
                    else {
                      last6under15min =  result[0].countwodunder15
                      db.query(`select count(*) as countwodunder7 from usercompletedwod
                      join workout on workoutId = workout.id
                      WHERE workoutId >= 205 and userId="tHV0mtFjkCfZMuEJ59qfdYvhPlO2" and timeInSec <= 7 * 60
                      limit 6;`, (err, result, fields) => {
                        if (err) console.log(err.message)
                        else {
                            countwodunder7 = result[0].countwodunder7
                            db.query(`select count(*) as countover15 from usercompletedwod
                            join workout on workoutId = workout.id
                            WHERE workoutId >= 205 and userId="tHV0mtFjkCfZMuEJ59qfdYvhPlO2" and timeInSec >= 15 * 60
                            limit 6;`, (err, result, fields) => {
                                if (err) console.log(err.message)
                                else {
                                    countover15 = result[0].countover15
                                    console.log(last6under15min, "under 15")
                                    console.log(countover15, "over 15")
                                    console.log(countwodunder7, "under 7")
                                    if (last6under15min >= 3) {
                                        db.query(`select id as workoutId from workout where timeinsec < 60 * 15;`, (err, result, fields) => {
                                            if (err) console.log(err.message)
                                            else {
                                                result.forEach(function(row) {
                    
                                                    excludedWodId.push(row.workoutId)     
                                                })
                                                
                                            }
                                        })
                                    }
                                    if (countover15 >= 2) {
                                        console.log("execute countover15")
                                        db.query(`select id as workoutId from workout where timeinsec >= 60 * 15;`, (err, result, fields) => {
                                            if (err) console.log(err.message)
                                            else {
                                                console.log(result)
                                                result.forEach(function(row) {
                                                
                    
                                                    excludedWodId.push(row.workoutId)
                                                    
                                                })
                                                db.query(`select workout.id, rounds AS numberOfRounds, timeInSec, typeName as workoutType from workout 
                                                JOIN WorkoutType ON Workout.workoutTypeId = WorkoutType.id
                                                where workout.id not in (${excludedWodId}) ORDER BY RAND()
                                                LIMIT 1 ;`, (err, result, fields) => {
                                                    if (err) console.log(err.message)
                                                    else {
                                                        console.log(result)
                                                        res.status(200).json(result[0]) 
                                                        
                                                    }
                                                })
                                            }
                                        })
                                    }
                                    if (countwodunder7 >= 1) {
                                        db.query(`select id as workoutId from workout where timeinsec < 60 * 7;`, (err, result, fields) => {
                                            if (err) console.log(err.message)
                                            else {
                                                result.forEach(function(row) {
                    
                                                    excludedWodId.push(row.workoutId)
                                                })
                                               
                                            }
                                        })
                                    }
                    
                                }
                            })
                        }
                      })
                    }
                })

                db.query(`# GET WORKOUT AND EXCLUDE MODALITE
                SELECT workout.id, rounds AS numberOfRounds, timeInSec, typeName as workoutType FROM workout
                JOIN WorkoutType ON Workout.workoutTypeId = WorkoutType.id
                WHERE workout.id NOT IN (
                # GIVES ALL THE WORKOUT THAT CONTAINS MODALITY PRESENT IN THE LAST TWO WORKOUT
                SELECT workoutID FROM ExerciceToWorkout
                JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
                JOIN Movement ON Exercice.movementId = Movement.id
                WHERE modaliteId IN (
                #GIVES THE MODAL ID PRESENT IN THE LAST TWO WOKOUT
                SELECT modalId FROM (SELECT Movement.modaliteId as modalId, COUNT(*) AS modalCount FROM (SELECT * FROM UserCompletedWod WHERE userId = "${userId}" ORDER BY id LIMIT 2) as table1
                JOIN Workout ON workoutId = Workout.id
                JOIN ExerciceToWorkout ON Workout.id = ExerciceToWorkout.workoutId
                JOIN Exercice ON ExerciceToWorkout.exerciceId = Exercice.id
                JOIN Movement ON Exercice.movementId = Movement.id
                GROUP BY Movement.modaliteId) as table2
                WHERE modalCount > 2
                )
                GROUP BY workoutID 
                )
                AND workoutTypeId != 3 AND workoutTypeId != 2
                ORDER BY RAND ()
                LIMIT 1;`, (err, result, fields) => {

                    if (err) console.log(err.message)
                    else {
                         
                    }
                });
            }
        })
                    
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

module.exports = router;