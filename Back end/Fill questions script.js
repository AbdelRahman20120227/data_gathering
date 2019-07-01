readXlsxFile = require('read-excel-file/node');
const axios = require('axios');

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

var file = "C:\\Users\\AbdelRahman\\Desktop\\Data gathering sync\\data_gathering\\competencies questions.xlsx";

readXlsxFile(file, { getSheets: true }).then((sheets) => {
    // sheets === [{ name: 'Sheet1' }, { name: 'Sheet2' }]

    sheets.forEach((e)=>{
        readXlsxFile(file, { sheet: e.name }).then((rows) => {
            
            console.log(e);
            axios.post("http://localhost/role", "name=" + e.name + "&general=0")
            .then(res=>{
                console.log(res.data);
                for(var i = 1; i < 6; i++){
                    for(var j = 1; j < 3; j++){
                        console.log(rows[i][j]);
                        axios.post("http://localhost/question", 
                        "text=" + rows[i][j] + "&role_name=" + e.name)
                        .then(res => {
                            console.log(res.data);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                    }
                }
            })
            .catch(err=>{
                console.log(err);
            });
            
        });        
    
    });
});


