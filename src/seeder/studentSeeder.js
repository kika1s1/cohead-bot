import mongoose from 'mongoose';
import { MONGODB_URI } from '../config/env.js'; // updated import path
import { StudentModel } from '../infrastructure/database/mongoose/StudentModel.js';
import { SessionModel } from '../infrastructure/database/mongoose/SessionModel.js';
import { HeadsUpSubmissionModel } from '../infrastructure/database/mongoose/HeadsUpSubmissionModel.js';
import { program } from 'commander';

const students = [
  // G61 Students
  { name: "Bethlehem Getachew Beyoro", group: "G61" }, 
  { name: "Binyam Abrha Abay", group: "G61" }, 
  { name: "Dagemawi Bekele Negash", group: "G61" }, 
  { name: "Dagmawi Kassa Kebede", group: "G61" }, 
  { name: "Eden Ephrem Adege", group: "G61" }, 
  { name: "Ermias Kindalem Amogne", group: "G61" }, 
  { name: "Ermiyas Tesfaye Ayalew", group: "G61" }, 
  { name: "Etsub Nadew Tekletsadik", group: "G61" }, 
  { name: "Fenet Mulugeta Ejeta", group: "G61" }, 
  { name: "Henock Tuna", group: "G61" }, 
  { name: "Henok Asaye Liyew", group: "G61" }, 
  { name: "Hibst Dereje Fekadu", group: "G61" }, 
  { name: "Jiru Gutema", group: "G61" }, 
  { name: "Kalkidan Abreham Alemu", group: "G61" }, 
  { name: "Lamesgin Desalegn Chameno", group: "G61" }, 
  { name: "Maedot Asrat Dereb", group: "G61" }, 
  { name: "Mahlet Asrat Tefera", group: "G61" }, 
  { name: "Meheret Alemu Wolde", group: "G61" }, 
  { name: "Mekdes Assefa Fetene", group: "G61" }, 
  { name: "Meron Sisay Aregay", group: "G61" }, 
  { name: "Muhammed Ebrahim", group: "G61" }, 
  { name: "Naomi Zerfu Shiferaw", group: "G61" }, 
  { name: "Niyat Debesay", group: "G61" }, 
  { name: "Sisay Tadewos Yale", group: "G61" }, 
  { name: "Tadesse Agegnehu Tebabal", group: "G61" }, 
  { name: "Tsedeke Techane Molla", group: "G61" }, 
  { name: "Wendwesen Getachew Beyene", group: "G61" }, 
  { name: "Yetmgeta Ewunetu Arega", group: "G61" }, 
  { name: "Yishak Gashaw Mekuria", group: "G61" }, 
  { name: "Yonas Tessema Achule", group: "G61" }, 
  { name: "Yonathan Desalegn Biyadglign", group: "G61" }, 
  // G62 Students
  { name: "Ashenafi Bizuwork Gebreyohannes", group: "G62" }, 
  { name: "Betel Mekasha Debele", group: "G62" }, 
  { name: "Bethlehem Mengist Tiruye", group: "G62" }, 
  { name: "Bezawit Girma Tsegaye", group: "G62" }, 
  { name: "Biniyam Tesfu Gasaw", group: "G62" }, 
  { name: "Biruk Geremew Abza", group: "G62" }, 
  { name: "Bisrat Maru Shibeshi", group: "G62" }, 
  { name: "Blen Redwan Shifa", group: "G62" }, 
  { name: "Dagmawit Sisay Feleke", group: "G62" }, 
  { name: "Dibora Taye Bekele", group: "G62" }, 
  { name: "Edilawit Manaye Endeshaw", group: "G62" }, 
  { name: "Ephraim Debel Negassa", group: "G62" }, 
  { name: "Feven Tewelde Haile", group: "G62" }, 
  { name: "Fikreyohanes Abera Shibru", group: "G62" }, 
  { name: "Finoteloza Sisay Yilma", group: "G62" }, 
  { name: "Gedion Zeyede Tefera", group: "G62" }, 
  { name: "Henok Tadesse Kersima", group: "G62" }, 
  { name: "Joshua Taye Alemayehu", group: "G62" }, 
  { name: "Kaletsidike Ayalew Mekonnen", group: "G62" }, 
  { name: "Nathan Fisseha Tsegaye", group: "G62" }, 
  { name: "Natnael Eyuel Yohannies", group: "G62" }, 
  { name: "Peniel Yohannes Fuge", group: "G62" }, 
  { name: "Rahel Yabebal Addis", group: "G62" }, 
  { name: "Sitotaw Ashagre", group: "G62" }, 
  { name: "Tsigemariam Zewdu Tadesse", group: "G62" }, 
  { name: "Yohannes Alemu Amare", group: "G62" }, 
  { name: "Yosef Gebreyesus Hagos", group: "G62" }, 
  { name: "Yosef Solomon Teferra", group: "G62" }, 
  { name: "Yoseph Berhanu Nuramo", group: "G62" }, 
  { name: "Zeamanuel Admasu Shibru", group: "G62" }, 
  // G63 Students
  { name: "Abenezer Solomon Tibebe", group: "G63" }, 
  { name: "Abrham Yishak Yifat", group: "G63" }, 
  { name: "Abubeker Taha Choke", group: "G63" }, 
  { name: "Anansi Sime Belay", group: "G63" }, 
  { name: "Biruk Demissie Lemma", group: "G63" }, 
  { name: "Bruk Gebru", group: "G63" }, 
  { name: "Eual Girma Yimer", group: "G63" }, 
  { name: "Eyasu Getaneh Ayele", group: "G63" }, 
  { name: "Feven Issayas Mulugeta", group: "G63" }, 
  { name: "Fraol Bacha Megersa", group: "G63" }, 
  { name: "Hayat Abdurezak Dari", group: "G63" }, 
  { name: "Hilina Zemedkun Bejiga", group: "G63" }, 
  { name: "Hintsete Hilawe Abera", group: "G63" }, 
  { name: "Hiwot Addis Abere", group: "G63" }, 
  { name: "Ibrahim Hassen Hussein", group: "G63" }, 
  { name: "Kaleab Shewangizaw Melese", group: "G63" }, 
  { name: "Milki Legesse", group: "G63" }, 
  { name: "Nathnael Merihun Mekonnen", group: "G63" }, 
  { name: "Natnael Yohanes Abdisa", group: "G63" }, 
  { name: "Nuel Mezemir Zewide", group: "G63" }, 
  { name: "Oliyad Mulugeta Negassa", group: "G63" }, 
  { name: "Ruth Ambaw Legesse", group: "G63" }, 
  { name: "Ruth Gashahun Gebreyes", group: "G63" }, 
  { name: "Samrawit Hailaeyesus Hursa", group: "G63" }, 
  { name: "Shalom Habtamu Mihrete", group: "G63" }, 
  { name: "Sophonias Tamene Seifu", group: "G63" }, 
  { name: "Venusia Biruk Dembel", group: "G63" }, 
  { name: "Yididia Abera Otiso", group: "G63" }, 
  { name: "Yohannes Worku Demissie", group: "G63" }, 
  { name: "Yonatan Getachew", group: "G63" }, 
  { name: "Yonatan Yishak Yifat", group: "G63" }, 
  // G64 Students
  { name: "Abebe Megibar Alemu", group: "G64" }, 
  { name: "Abel Erduno Hakenso", group: "G64" }, 
  { name: "Abel Tesfa Awel", group: "G64" }, 
  { name: "Alazar Addis Gebreselassie", group: "G64" }, 
  { name: "Ashenafi Dejene Negash", group: "G64" }, 
  { name: "Bemnet Aschalew Wodaj", group: "G64" }, 
  { name: "Betsinat Amare Teshome", group: "G64" }, 
  { name: "Biruh Tesfahun Alameraw", group: "G64" }, 
  { name: "Dame Abera Negeri", group: "G64" }, 
  { name: "Eden Zewdu Tadesse", group: "G64" }, 
  { name: "Gizachew Mohammed Jemal", group: "G64" }, 
  { name: "Hermela Andargie Wondu", group: "G64" }, 
  { name: "Hunegna Demissie Bekele", group: "G64" }, 
  { name: "Lamrot Tariku Shire", group: "G64" }, 
  { name: "Meklit Asrat Tefera", group: "G64" }, 
  { name: "Mikreselasie Abiy Eseye", group: "G64" }, 
  { name: "Nafargi Damena Geda", group: "G64" }, 
  { name: "Nahom Teguade Kassa", group: "G64" }, 
  { name: "Naol Aboma Tiki", group: "G64" }, 
  { name: "Naomi Meseret Mulatu", group: "G64" }, 
  { name: "Nathanael Cheramlak Wolde", group: "G64" }, 
  { name: "Ruth Alemfanta Aregay", group: "G64" }, 
  { name: "Teshome Birhanu Cheru", group: "G64" }, 
  { name: "Tsion Getaneh Amsalu", group: "G64" }, 
  { name: "Tsion Melese Asfaw", group: "G64" }, 
  { name: "Welela Bekele Regassa", group: "G64" }, 
  { name: "Yeabisra Moges Mulat", group: "G64" }, 
  { name: "Yonas Ayele Tola", group: "G64" }, 
  { name: "Yonas Baysasaw Kibret", group: "G64" }, 
  { name: "Zufan Gebrehiwot Hadgu", group: "G64" }, 
  // G65 Students
  { name: "Dawit Birhanu Beyene", group: "G65" }, 
  { name: "Samson Demessie Ayalew", group: "G65" }, 
  { name: "Emran Seid Mohammed", group: "G65" }, 
  { name: "Hilina Fiseha Kifle", group: "G65" }, 
  { name: "Abdrehim Misbah Abdella", group: "G65" }, 
  { name: "Philipos Hailu Abrham", group: "G65" }, 
  { name: "Yohannes Muluken Assefa", group: "G65" }, 
  { name: "Liya Tsegaye Hagos", group: "G65" }, 
  { name: "Sosena Gossaye", group: "G65" }, 
  { name: "Kidus Asebe Demissie", group: "G65" }, 
  { name: "Hemenawit Girma Tulu", group: "G65" }, 
  { name: "Yohannes Tigistu Worku", group: "G65" }, 
  { name: "Temesgen Abebayehu", group: "G65" }, 
  { name: "Mahlet Solomon", group: "G65" }, 
  { name: "Lidiya Abebe Mekonen", group: "G65" }, 
  { name: "Kirubel Legese Habtu", group: "G65" }, 
  { name: "Leulseged Melaku Damota", group: "G65" }, 
  { name: "Aelaf Tsegaye Getaneh", group: "G65" }, 
  { name: "Yared Habtamu Desalegn", group: "G65" }, 
  { name: "Zekariyas Kumsa Godana", group: "G65" }, 
  { name: "Azeb Liknaw Kehali", group: "G65" }, 
  { name: "Robel Desalegn Shirgema", group: "G65" }, 
  { name: "Dagmawit Yoseph Mekonnen", group: "G65" }, 
  { name: "Dagmawit Tibebu Terefe", group: "G65" }, 
  { name: "Tsion Mengistu Shimeles", group: "G65" }, 
  { name: "Beamlak Solomon Mulatu", group: "G65" }, 
  { name: "Naol Yadete Wordofa", group: "G65" }, 
  { name: "Abduselam Sultan Zakir", group: "G65" }, 
  { name: "Mesud Melaku Asfaw", group: "G65" }, 
  { name: "Rajaf Dereje Gudeta", group: "G65" }, 
  // G66 Students
  { name: "Abenezer Mesfin Molla", group: "G66" }, 
  { name: "Adey Ebuy Assefa", group: "G66" }, 
  { name: "Anteneh Getnet Tirfu", group: "G66" }, 
  { name: "Ashenafi Mulugeta Alemu", group: "G66" }, 
  { name: "Bemnet Kebede Zewude", group: "G66" }, 
  { name: "Birhan Aklilu Gebreyohannes", group: "G66" }, 
  { name: "Daniel Yilma Habtemariam", group: "G66" }, 
  { name: "Eden Belayneh Ayalew", group: "G66" }, 
  { name: "Eyosias Mulugeta Solko", group: "G66" }, 
  { name: "Hana Abiyu Wubneh", group: "G66" }, 
  { name: "Izzat Engida Endalew", group: "G66" }, 
  { name: "Kaleab Hailemeskel Tadesse", group: "G66" }, 
  { name: "Kenan Mengistu Zewide", group: "G66" }, 
  { name: "Liben Gebremedhin Seta", group: "G66" }, 
  { name: "Mahder Ashenafi Kefene", group: "G66" }, 
  { name: "Milkiyas Hailu Belayneh", group: "G66" }, 
  { name: "Mohammedamin Keyru Jemal", group: "G66" }, 
  { name: "Nahom Hailu Tasissa", group: "G66" }, 
  { name: "Nathan Haylemaryam Abay", group: "G66" }, 
  { name: "Natnael Defaru Tesema", group: "G66" }, 
  { name: "Natnael Desalegn Teferi", group: "G66" }, 
  { name: "Natnael Yonas Asefaw", group: "G66" }, 
  { name: "Ruhama Fikre Dana", group: "G66" }, 
  { name: "Salem Habte", group: "G66" }, 
  { name: "Solomon Tadesse Fikre", group: "G66" }, 
  { name: "Tewuhbo Mihret Tseganeh", group: "G66" }, 
  { name: "Tsiyon Gashaw Mihretu", group: "G66" }, 
  { name: "Yeabsira Mekonnen Worku", group: "G66" }, 
  { name: "Yohanna Betsiha Merawi", group: "G66" }, 
  // G67 Students
  { name: "Blien Moges Kassie", group: "G67" }, 
  { name: "Maedot Amha Alemu", group: "G67" }, 
  { name: "Mekdelawit Abadina Kassa", group: "G67" }, 
  { name: "Mikiyas Alemayehu Mekonen", group: "G67" }, 
  { name: "Nanati Dereje Wakjira", group: "G67" }, 
  { name: "Nathnael Tamirat Woldemariam", group: "G67" }, 
  { name: "Nebat Hussen Yimam", group: "G67" }, 
  { name: "Niyat Hannibal Beyene", group: "G67" }, 
  { name: "Yared Wondatir Demie", group: "G67" }, 
  { name: "Anteneh Addisu Mekonnen", group: "G67" }, 
  { name: "Ayub Sufian Bedru", group: "G67" }, 
  { name: "Estifanos Samson Badeg", group: "G67" }, 
  { name: "Lemesa Elias Miju", group: "G67" }, 
  { name: "Meklit Melkamu Ayele", group: "G67" }, 
  { name: "Mikias Goitom Solomon", group: "G67" }, 
  { name: "Rakeb Yared Tigabu", group: "G67" }, 
  { name: "Redeat Birhane Alem", group: "G67" }, 
  { name: "Yiheyis Tamir Ayalew", group: "G67" }, 
  { name: "Yihune Zewdie Woldie", group: "G67" }, 
  { name: "Alazar Gebre Habtemariam", group: "G67" }, 
  { name: "Amanuel Wubishet Bezabih", group: "G67" }, 
  { name: "Eden Melaku Dagnaw", group: "G67" }, 
  { name: "Haylemeskel Haylemariam Bantiyerga", group: "G67" }, 
  { name: "Haymanot Aweke", group: "G67" }, 
  { name: "Kidus Efrem", group: "G67" }, 
  { name: "Mitiku Melkamsew Seid", group: "G67" }, 
  { name: "Natannan Zeleke Mekonnen", group: "G67" }, 
  { name: "Tamirat Dejene Wondimu", group: "G67" }, 
  { name: "Tesfamichael Tafere Belay", group: "G67" }, 
  // G68 Students
  { name: "Abel Bekele Demissie", group: "G68" }, 
  { name: "Abenezer Seleshi Abdisa", group: "G68" }, 
  { name: "Abenezer Terefe Kedida", group: "G68" }, 
  { name: "Amina Yassin Ahmed", group: "G68" }, 
  { name: "Ayana Samuel Terefe", group: "G68" }, 
  { name: "Ayub Nasir Seid", group: "G68" }, 
  { name: "Bereket Aschalew Bayu", group: "G68" }, 
  { name: "Betelhem Yehuala Abebe", group: "G68" }, 
  { name: "Biruk Tadele Argaw", group: "G68" }, 
  { name: "Estifanos Ameha Mekonnen", group: "G68" }, 
  { name: "Firomsa Assefa Roba", group: "G68" }, 
  { name: "Foziya Damtew Abate", group: "G68" }, 
  { name: "Gemechu Alemu Bedasa", group: "G68" }, 
  { name: "Hana Mesfin Degsew", group: "G68" }, 
  { name: "Ibrahim Muhaba Ismael", group: "G68" }, 
  { name: "Kidist Ayele Mulat", group: "G68" }, 
  { name: "Lencho Lachisa Nagasa", group: "G68" }, 
  { name: "Miraf Amare Haile", group: "G68" }, 
  { name: "Muhammed Samson Mamo", group: "G68" }, 
  { name: "Nibru Kefyalew Tessema", group: "G68" }, 
  { name: "Obsa Abdulkadir Adem", group: "G68" }, 
  { name: "Remedan Jemal Gemeda", group: "G68" }, 
  { name: "Segni Girma Guta", group: "G68" }, 
  { name: "Tsedniya Frezewed Ayele", group: "G68" }, 
  { name: "Uzair Abdulalim Bedewi", group: "G68" }, 
  { name: "Webi Muleta Dinka", group: "G68" }, 
  { name: "Yabets Zekaryas Manale", group: "G68" }, 
  { name: "Yohanan Solomon Megerssa", group: "G68" }, 
  { name: "Yohannes Gezachew Mekonnen", group: "G68" }, 
  { name: "Zaferan Miftah Akmel", group: "G68" }, 
  // G69 Students
  { name: "Abdiwak Amsalu Duressa", group: "G69" }, 
  { name: "Abdulaziz Isa Seid", group: "G69" }, 
  { name: "Abdulbaset Adem", group: "G69" }, 
  { name: "Abredagn Kebede Dimore", group: "G69" }, 
  { name: "Ahlam Zeynu Redi", group: "G69" }, 
  { name: "Bemnet Mussa Meshesha", group: "G69" }, 
  { name: "Bereket Kume Kebede", group: "G69" }, 
  { name: "Chernet Mequannent Bantie", group: "G69" }, 
  { name: "Elham Abdu", group: "G69" }, 
  { name: "Eyerusalem Hailemariam Agegnehu", group: "G69" }, 
  { name: "Ezra Leye Lemecha", group: "G69" }, 
  { name: "Fenet Damena Tefera", group: "G69" }, 
  { name: "Firaol Gelana Ararsa", group: "G69" }, 
  { name: "Gebriel Admasu Abuye", group: "G69" }, 
  { name: "Huzeyfa Suleyman Kemal", group: "G69" }, 
  { name: "Jaefer Mohammed Kemal", group: "G69" }, 
  { name: "Jaleta Kebede Kasure", group: "G69" }, 
  { name: "Kalid Jemal Adem", group: "G69" }, 
  { name: "Leul Gedion Tiruneh", group: "G69" }, 
  { name: "Liben Adugna Wako", group: "G69" }, 
  { name: "Matthias Mulugeta Abate", group: "G69" }, 
  { name: "Meheretu Abate Erana", group: "G69" }, 
  { name: "Robsen Teshoma", group: "G69" }, 
  { name: "Sabona Waktole Tafese", group: "G69" }, 
  { name: "Sadam Husen Ali", group: "G69" }, 
  { name: "Salim Jibril Abdulkader", group: "G69" }, 
  { name: "Samrawit Alemu Abshiro", group: "G69" }, 
  { name: "Sifhoran Regassa Gidisa", group: "G69" }, 
  { name: "Surafel Takele Injigu", group: "G69" }, 
  { name: "Yafet Tesfaye Lema", group: "G69" }, 
];

async function seedStudents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding students.');
    
    // Optionally clear existing students for each group
    await StudentModel.deleteMany({ group: { $in: ["G61", "G62", "G63", "G64", "G65", "G66", "G67", "G68", "G69"] } });
    
    // Helper to assign school based on group
    function getSchoolByGroup(group) {
      if (["G68", "G69"].includes(group)) {
        return "ASTU";
      } else if (["G65", "G66", "G67"].includes(group)) {
        return "AASTU";
      } else if (["G61", "G62", "G63", "G64"].includes(group)) {
        return "AIT";
      }
      return "";
    }
    
    // Map each student to include the school and other details
    const studentsWithSchool = students.map(student => ({
      ...student,
      school: getSchoolByGroup(student.group),
      telegram_id: "",   // initially empty, to be updated upon registration
      isRegistered: false
    }));
    
    const inserted = await StudentModel.insertMany(studentsWithSchool);
    console.log(`Inserted ${inserted.length} students`);
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}



async function deleteAllStudents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for deleting all students.');

    const student = await StudentModel.deleteMany({});
    const session = await SessionModel.deleteMany({})
    const headsup = await HeadsUpSubmissionModel.deleteMany({})

    console.log(`Deleted ${student.deletedCount} students.`);
    console.log(`Deleted ${session.deletedCount} sessions.`);
    console.log(`Deleted ${headsup.deletedCount} headsups.`);
    process.exit(0);
  } catch (err) {
    console.error('Error deleting all students:', err);
    process.exit(1);
  }
}

// Optionally call the function
// deleteAllStudents();


program
  .version('1.0.0')
  .description('Seed or delete student data from the database')
  .option('-s, --seed', 'Seed the database with student data')
  .option('-d, --delete', 'Delete all student data from the database')
  .parse(process.argv);

const options = program.opts();

if (options.seed) {
  seedStudents();
} else if (options.delete) {
  deleteAllStudents();

} else {
  console.log('No option specified. Use -s to seed or -d to delete.');
}