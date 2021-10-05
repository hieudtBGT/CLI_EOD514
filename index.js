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

const GetArrJSONData = filePath => {
    const workBook = XLSX.readFile(filePath, { cellDates: true });
    const firstSheetName = workBook.SheetNames[0];
    const workSheet = workBook.Sheets[firstSheetName];

    const data = XLSX.utils.sheet_to_json(workSheet);

    return data;
}

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
                oss_date: ArrJsonData[i]['oss_date']
            }

            filteredData.push(row)
        }

        let date = ArrJsonData[0]['oss_date']
        date = new Date(date).toDateString()

        let dailySales = filteredData.reduce((sale, row) => {
            return sale += row.net_sales_amt
        }, 0)

        let activePOS = filteredData.filter(row => row.net_sales_amt != 0).length

        return { date, dailySales, activePOS }
    } catch (error) {
        throw new Error(error);
    }
}

const bypass = chalk.greenBright('[  OK  ] ')
const failed = chalk.yellowBright('[  FAIL  ] ')

const MyPrompt = () => {
    inquirer.prompt(MainMenu)
        .then(answers => {
            if (answers.menu === 'Exit') {
                console.log('\nGoodbye.')
            }

            if (answers.menu === 'Count Active POS') {
                inquirer.prompt(SubMenuActivePOS)
                    .then(async inputPath => {
                        let arrJson = GetArrJSONData(inputPath.filePath)

                        let { date, dailySales, activePOS } = await HandleData(arrJson, inputPath.totalGame)

                        if (date !== 'Invalid Date' && isNaN(dailySales) == false) {
                            dailySales = dailySales.toLocaleString()
                            activePOS = activePOS.toLocaleString()
                            console.log('\n')
                            console.log(bypass, chalk.greenBright('Date .............: '), chalk.blueBright(date))
                            console.log(bypass, chalk.greenBright('Daily sales.......: '), chalk.blueBright(dailySales))
                            console.log(bypass, chalk.greenBright('Active POS count..: '), chalk.blueBright(activePOS))
                            console.log('\n\n')
                        }
                        else console.log('\n', failed, "Incorrect file, please try again with EOD514.xlsx'path !\n")

                        return MyPrompt()
                    })
                    .catch(readError => console.log(failed, readError));
            }
        }).catch(error => console.log(`${failed} Unknown error: ${error}`));

};

const Main = () => {
    console.log(chalk.greenBright(figlet.textSync('H Y O U D O U')))

    MyPrompt()
}

// Run Program
Main()