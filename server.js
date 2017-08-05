var webdriver = require('selenium-webdriver');
var settings = require('./settings.json');
var Promise = require('promise');
var fs = require('fs');

var parseXlsx = require('excel');
var users = [];
var userLike = 0;
var likes = 0;

parseXlsx('in.xlsx', function(err, data) {
  if(err) throw err;
  for(var i = 811; i<data.length; i++){
      users.push(data[i][0]);
      if(i == 815) break;
  }

    // data is an array of arrays
});

//var xpath_first_photo = '//header/../div/div/div[1]/a[1]';
var xpath_first_photo = '//body/span[1]/section[1]/main[1]/article[1]/div[1]/div[1]/div[1]/div[1]';
var xpath_like_class = '//div[@id="fb-root"]/following-sibling::div[1]/div/div/following-sibling::div[1]/div/div[2]/div[1]/article/div[2]/section/a/span';
var xpath_like_button = '//div[@id="fb-root"]/following-sibling::div[1]/div/div/following-sibling::div[1]/div/div[2]/div[1]/article/div[2]/section/a';
var xpath_nextprev_buttons = '//div[@id="fb-root"]/following-sibling::div[1]/div/div/following-sibling::div[1]/div/div/div/div/a';
var xpath_following = '//div[@id="fb-root"]/following-sibling::div[1]/div/div/following-sibling::div[1]/div/div[2]/div[1]/article/header/span/button';

var By = require('selenium-webdriver').By;
var until = require('selenium-webdriver').until;

var driver = new webdriver.Builder().forBrowser('firefox').build();

//driver.manage().window().maximize();
driver.manage().deleteAllCookies();
driver.get('https://www.instagram.com/accounts/login/');


driver.sleep(settings.sleep_delay);

driver.findElement(By.name('username')).sendKeys(settings.instagram_account_username);
driver.findElement(By.name('password')).sendKeys(settings.instagram_account_password);

driver.findElement(By.xpath('//button')).click();
driver.sleep(settings.sleep_delay).then(function() {
    like_by_nickname(0);
});

function like_by_nickname(indexNickname) {
    if (indexNickname >= users.length) {
        fs.appendFileSync("Log.txt", "Everything is done. Finishing...!"+'\r\n');
        console.info('Everything is done. Finishing...');
        fs.appendFileSync("Log.txt", "=========== ");
        fs.appendFileSync("Log.txt", "===LIKES=== "+likes+'\r\n');
        fs.appendFileSync("Log.txt", "===USERS=== "+userLike+'\r\n');
        fs.appendFileSync("Log.txt", "=========== ");
        driver.quit();
        return;
    }
    var promise = new Promise(function (resolve, reject) {
        driver.sleep(settings.sleep_delay);
        console.info('Doing likes for: ' + users[indexNickname]);
        fs.appendFileSync("Log.txt", 'Doing likes for: ' + users[indexNickname]+'\r\n');
        driver.get('https://instagram.com/' + users[indexNickname]);

        driver.sleep(settings.sleep_delay);
        driver.findElement(By.xpath(xpath_first_photo)).click().then(function () {
            userLike++;
            like(resolve, 0, settings.like_depth_per_user);
        }).catch(function(e) {
          console.log("====ERROR===== "+e.message);
          fs.appendFileSync("Log.txt", "====ERROR===== "+e.message+'\r\n');
          indexNickname++;
          like_by_nickname(indexNickname);
        });
    });
    promise.then(function() {
        indexNickname++;
        like_by_nickname(indexNickname);
    })
};
function like(resolve, index, max_likes) {
    driver.getCurrentUrl().then(function(url) {

      driver.sleep(settings.10000);
      driver.findElement(By.xpath(xpath_following)).getAttribute('class').then(function(classname) {
        if(classname.indexOf('_6y2ah') < 0){
          driver.findElement(By.xpath(xpath_following)).click().then(function () {
            fs.appendFileSync("Log.txt", 'Following'+'\r\n');
          }).catch(function (e) {
            console.log("ERROR "+e.message)
            fs.appendFileSync("Log.txt", '====Error Following==== '+e.message+'\r\n');
          });
        }
      });

        console.info('Current url:   ' + url);
        fs.appendFileSync("Log.txt", 'Current url:   ' + url+'\r\n');
        //driver.sleep(settings.sleep_delay);

        driver.findElement(By.xpath(xpath_like_class)).getAttribute('class').then(function(classname) {
            console.info('CSS Classname: ' + classname);
            if (settings.smart_like_mode && (classname.indexOf('coreSpriteHeartFull') > 0)) {
                console.info('Already liked. Stopping...');
                fs.appendFileSync("Log.txt", 'Already liked. Stopping...'+'\r\n');
                resolve();
                return;
            } else {
                if (classname.indexOf('coreSpriteHeartOpen') > 0) {
                    driver.findElement(By.xpath(xpath_like_button)).click();
                    driver.sleep(settings.sleep_delay);
                };
                // Analyzing "Next" button availability
                driver.findElements(By.xpath(xpath_nextprev_buttons)).then(function(buttons) {
                    console.info('Buttons: ' + buttons.length + ', Photo Index: ' + index);
                    if (((index == 0) && (buttons.length == 1)) || (buttons.length == 2)) {
                        buttons[buttons.length - 1].click().then(function() {
                            // if we exceed maximum likes depth, stop like this current user.
                            index++;
                            likes++;
                            if (index == max_likes) {
                                resolve();
                                return;
                            }
                            like(resolve, index, max_likes);
                        });
                    } else {
                        // "Next" button doesn't exist. Stop like this current user.
                        console.info('Next button does not exist. Stopping...');
                        fs.appendFileSync("Log.txt", 'Next button does not exist. Stopping...'+'\r\n');
                        resolve();
                        return;
                    }
                });
            }
        });
    });
}

//driver.quit();