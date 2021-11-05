const inquirer = require('inquirer')
const XLSX = require('xlsx')
const figlet = require('figlet')
const chalk = require('chalk')

const fs = require('fs')

const MainMenu = [
    {
        type: 'list',
        name: 'menu',
        message: chalk.greenBright('Choose an option:\n---------------------\n'),
        choices: ['Count Active POS', 'Exit']
    }
];

const SubMenuActivePOS = [
    {
        type: 'input',
        name: 'filePath',
        message: chalk.greenBright('Enter file path of EOD514.xlsx:'),

        validate(value) {
            value = value.replace(/"/g, '');
            if (fs.existsSync(value)) {
                return true;
            }

            return chalk.yellowBright('This file path is not valid !!')
        }
    },
    {
        type: 'input',
        name: 'totalGame',
        message: chalk.greenBright('Enter NUMBER of current games in EOD514.xlsx: '),

        validate(value) {
            if (isNaN(value)) {
                return chalk.yellowBright('Please enter a NUMBER')
            }

            return true;
        }
    }
];

// Return Array Json Object
const GetArrJSONData = async filePath => {
    filePath = filePath.replace(/"/g, '');

    const workBook = XLSX.readFile(filePath);
    const firstSheetName = workBook.SheetNames[0];
    const workSheet = workBook.Sheets[firstSheetName];

    const data = XLSX.utils.sheet_to_json(workSheet, { raw: true });

    return data;
}

// Proceed EOD514 here
// Return a Json Object
const HandleData = async (ArrJsonData, totalGame) => {
    try {
        let filteredData = []
        for (let i = 0; i < ArrJsonData.length; i = i + Number(totalGame)) {
            let posSales = 0;

            for (let j = i; j < ArrJsonData.length; j++) {
                posSales = posSales + ArrJsonData[j]['net_sales_amt']

                if (j == (i + Number(totalGame) - 1)) {
                    break;
                }
            }

            const row = {
                pos: ArrJsonData[i]['pos'],
                net_sales_amt: posSales,
                oss_date: ArrJsonData[i]['eod_date']
            }

            filteredData.push(row)
        }

        let date = ArrJsonData[ArrJsonData.length - 1]['eod_date']

        // package issue wrong date : https://github.com/SheetJS/sheetjs/issues/1223
        // below code will fix it
        date = new Date(Math.round((date - 25569) * 86400 * 1000)).toDateString();

        let dailySales = filteredData.reduce((sale, row) => {
            return sale += Number(row.net_sales_amt);
        }, 0)

        let activePOS = filteredData.filter(row => row.net_sales_amt != 0).length

        return { date, dailySales, activePOS }
    } catch (error) {
        throw new Error(error);
    }
}

const MyPrompt = async () => {
    // Mark
    const bypass = chalk.greenBright('[  OK  ] ');
    const failed = chalk.yellowBright('[  FAIL  ] ');
    try {
        const answerMainMenu = await inquirer.prompt(MainMenu);

        if (answerMainMenu.menu === 'Exit') {
            console.log('\n', chalk.cyanBright('Goodbye.'));
            setTimeout(() => { }, 500);
        };

        if (answerMainMenu.menu === 'Count Active POS') {
            const inputArgs = await inquirer.prompt(SubMenuActivePOS);

            console.log('\n', chalk.cyanBright('In Progress ...'));

            let arrJson = await GetArrJSONData(inputArgs.filePath);

            let { date, dailySales, activePOS } = await HandleData(arrJson, inputArgs.totalGame);

            if (date !== 'Invalid Date' && isNaN(dailySales) == false) {
                dailySales = dailySales.toLocaleString();
                activePOS = activePOS.toLocaleString();

                console.log(bypass, chalk.greenBright('Date .............: '), chalk.cyanBright(date));
                console.log(bypass, chalk.greenBright('Daily sales.......: '), chalk.cyanBright(dailySales));
                console.log(bypass, chalk.greenBright('Active POS count..: '), chalk.cyanBright(activePOS));
                console.log('\n');
            }
            else console.log(`${failed}Incorrect file, please try again with EOD514.xlsx'path !\n`)

            return MyPrompt()
        }
    } catch (error) {
        console.log(`${failed}Unknown error: ${error}\n`)
    }
}

const Main = () => {
    console.log(chalk.greenBright(figlet.textSync('H Y O U D O U')))

    MyPrompt()
}

// Run Program
Main()