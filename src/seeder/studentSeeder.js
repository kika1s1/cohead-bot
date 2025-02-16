import mongoose from 'mongoose';
import { MONGODB_URI } from '../config/env.js'; // updated import path
import { StudentModel } from '../infrastructure/database/mongoose/StudentModel.js';

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
  { name: "ashenafi bizuwork gebreyohannes", group: "G62" },
  { name: "betel mekasha debele", group: "G62" },
  { name: "bethlehem mengist tiruye", group: "G62" },
  { name: "bezawit girma tsegaye", group: "G62" },
  { name: "biniyam tesfu gasaw", group: "G62" },
  { name: "biruk geremew abza", group: "G62" },
  { name: "bisrat maru shibeshi", group: "G62" },
  { name: "blen redwan shifa", group: "G62" },
  { name: "dagmawit sisay feleke", group: "G62" },
  { name: "dibora taye bekele", group: "G62" },
  { name: "edilawit manaye endeshaw", group: "G62" },
  { name: "ephraim debel negassa", group: "G62" },
  { name: "feven tewelde haile", group: "G62" },
  { name: "fikreyohanes abera shibru", group: "G62" },
  { name: "finoteloza sisay yilma", group: "G62" },
  { name: "gedion zeyede tefera", group: "G62" },
  { name: "henok tadesse kersima", group: "G62" },
  { name: "joshua taye alemayehu", group: "G62" },
  { name: "kaletsidike ayalew mekonnen", group: "G62" },
  { name: "nathan fisseha tsegaye", group: "G62" },
  { name: "natnael eyuel yohannies", group: "G62" },
  { name: "peniel yohannes fuge", group: "G62" },
  { name: "rahel yabebal addis", group: "G62" },
  { name: "sitotaw ashagre", group: "G62" },
  { name: "tsigemariam zewdu tadesse", group: "G62" },
  { name: "yohannes alemu amare", group: "G62" },
  { name: "yosef gebreyesus hagos", group: "G62" },
  { name: "yosef solomon teferra", group: "G62" },
  { name: "yoseph berhanu nuramo", group: "G62" },
  { name: "zeamanuel admasu shibru", group: "G62" },
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
  { name: "venusia biruk dembel", group: "G63" },
  { name: "Yididia Abera Otiso", group: "G63" },
  { name: "Yohannes Worku Demissie", group: "G63" },
  { name: "Yonatan Getachew", group: "G63" },
  { name: "Yonatan Yishak Yifat", group: "G63" },
  // G64 Students
  { name: "abebe megibar alemu", group: "G64" },
  { name: "abel erduno hakenso", group: "G64" },
  { name: "abel tesfa awel", group: "G64" },
  { name: "alazar addis gebreselassie", group: "G64" },
  { name: "ashenafi dejene negash", group: "G64" },
  { name: "bemnet aschalew wodaj", group: "G64" },
  { name: "betsinat amare teshome", group: "G64" },
  { name: "biruh tesfahun alameraw", group: "G64" },
  { name: "dame abera negeri", group: "G64" },
  { name: "eden zewdu tadesse", group: "G64" },
  { name: "gizachew mohammed jemal", group: "G64" },
  { name: "hermela andargie wondu", group: "G64" },
  { name: "hunegna demissie bekele", group: "G64" },
  { name: "lamrot tariku shire", group: "G64" },
  { name: "meklit asrat tefera", group: "G64" },
  { name: "mikreselasie abiy eseye", group: "G64" },
  { name: "nafargi damena geda", group: "G64" },
  { name: "nahom teguade kassa", group: "G64" },
  { name: "naol aboma tiki", group: "G64" },
  { name: "naomi meseret mulatu", group: "G64" },
  { name: "nathanael cheramlak wolde", group: "G64" },
  { name: "ruth alemfanta aregay", group: "G64" },
  { name: "teshome birhanu cheru", group: "G64" },
  { name: "tsion getaneh amsalu", group: "G64" },
  { name: "tsion melese asfaw", group: "G64" },
  { name: "welela bekele regassa", group: "G64" },
  { name: "yeabisra moges mulat", group: "G64" },
  { name: "yonas ayele tola", group: "G64" },
  { name: "yonas baysasaw kibret", group: "G64" },
  { name: "zufan gebrehiwot hadgu", group: "G64" },
  // G65 Students
  { name: "dawit birhanu beyene", group: "G65" },
  { name: "samson demessie ayalew", group: "G65" },
  { name: "emran seid mohammed", group: "G65" },
  { name: "hilina fiseha kifle", group: "G65" },
  { name: "abdrehim misbah abdella", group: "G65" },
  { name: "philipos hailu abrham", group: "G65" },
  { name: "yohannes muluken assefa", group: "G65" },
  { name: "liya tsegaye hagos", group: "G65" },
  { name: "sosena gossaye", group: "G65" },
  { name: "kidus asebe demissie", group: "G65" },
  { name: "hemenawit girma tulu", group: "G65" },
  { name: "yohannes tigistu worku", group: "G65" },
  { name: "temesgen abebayehu", group: "G65" },
  { name: "mahlet solomon", group: "G65" },
  { name: "lidiya abebe mekonen", group: "G65" },
  { name: "kirubel legese habtu", group: "G65" },
  { name: "leulseged melaku damota", group: "G65" },
  { name: "aelaf tsegaye getaneh", group: "G65" },
  { name: "yared habtamu desalegn", group: "G65" },
  { name: "zekariyas kumsa godana", group: "G65" },
  { name: "azeb liknaw kehali", group: "G65" },
  { name: "robel desalegn shirgema", group: "G65" },
  { name: "dagmawit yoseph mekonnen", group: "G65" },
  { name: "dagmawit tibebu terefe", group: "G65" },
  { name: "tsion mengistu shimeles", group: "G65" },
  { name: "beamlak solomon mulatu", group: "G65" },
  { name: "naol yadete wordofa", group: "G65" },
  { name: "abduselam sultan zakir", group: "G65" },
  { name: "mesud melaku asfaw", group: "G65" },
  { name: "rajaf dereje gudeta", group: "G65" },
  // G66 Students
  { name: "abenezer mesfin molla", group: "G66" },
  { name: "adey ebuy assefa", group: "G66" },
  { name: "anteneh getnet tirfu", group: "G66" },
  { name: "ashenafi mulugeta alemu", group: "G66" },
  { name: "bemnet kebede zewude", group: "G66" },
  { name: "birhan aklilu gebreyohannes", group: "G66" },
  { name: "daniel yilma habtemariam", group: "G66" },
  { name: "eden belayneh ayalew", group: "G66" },
  { name: "eyosias mulugeta solko", group: "G66" },
  { name: "hana abiyu wubneh", group: "G66" },
  { name: "izzat engida endalew", group: "G66" },
  { name: "kaleab hailemeskel tadesse", group: "G66" },
  { name: "kenan mengistu zewide", group: "G66" },
  { name: "liben gebremedhin seta", group: "G66" },
  { name: "mahder ashenafi kefene", group: "G66" },
  { name: "milkiyas hailu belayneh", group: "G66" },
  { name: "mohammedamin keyru jemal", group: "G66" },
  { name: "nahom hailu tasissa", group: "G66" },
  { name: "nathan haylemaryam abay", group: "G66" },
  { name: "natnael defaru tesema", group: "G66" },
  { name: "natnael desalegn teferi", group: "G66" },
  { name: "natnael yonas asefaw", group: "G66" },
  { name: "ruhama fikre dana", group: "G66" },
  { name: "salem habte", group: "G66" },
  { name: "solomon tadesse fikre", group: "G66" },
  { name: "tewuhbo mihret tseganeh", group: "G66" },
  { name: "tsiyon gashaw mihretu", group: "G66" },
  { name: "yeabsira mekonnen worku", group: "G66" },
  { name: "yohanna betsiha merawi", group: "G66" },
  // G67 Students
  { name: "blien moges kassie", group: "G67" },
  { name: "maedot amha alemu", group: "G67" },
  { name: "mekdelawit abadina kassa", group: "G67" },
  { name: "mikiyas alemayehu mekonen", group: "G67" },
  { name: "nanati dereje wakjira", group: "G67" },
  { name: "nathnael tamirat woldemariam", group: "G67" },
  { name: "nebat hussen yimam", group: "G67" },
  { name: "niyat hannibal beyene", group: "G67" },
  { name: "yared wondatir demie", group: "G67" },
  { name: "anteneh addisu mekonnen", group: "G67" },
  { name: "ayub sufian bedru", group: "G67" },
  { name: "estifanos samson badeg", group: "G67" },
  { name: "lemesa elias miju", group: "G67" },
  { name: "meklit melkamu ayele", group: "G67" },
  { name: "mikias goitom solomon", group: "G67" },
  { name: "rakeb yared tigabu", group: "G67" },
  { name: "redeat birhane alem", group: "G67" },
  { name: "yiheyis tamir ayalew", group: "G67" },
  { name: "yihune zewdie woldie", group: "G67" },
  { name: "alazar gebre habtemariam", group: "G67" },
  { name: "amanuel wubishet bezabih", group: "G67" },
  { name: "eden melaku dagnaw", group: "G67" },
  { name: "haylemeskel haylemariam bantiyerga", group: "G67" },
  { name: "haymanot aweke", group: "G67" },
  { name: "kidus efrem", group: "G67" },
  { name: "mitiku melkamsew seid", group: "G67" },
  { name: "natannan zeleke mekonnen", group: "G67" },
  { name: "tamirat dejene wondimu", group: "G67" },
  { name: "tesfamichael tafere belay", group: "G67" },
  // G68 Students
  { name: "abel bekele demissie", group: "G68" },
  { name: "abenezer seleshi abdisa", group: "G68" },
  { name: "abenezer terefe kedida", group: "G68" },
  { name: "amina yassin ahmed", group: "G68" },
  { name: "ayana samuel terefe", group: "G68" },
  { name: "ayub nasir seid", group: "G68" },
  { name: "bereket aschalew bayu", group: "G68" },
  { name: "betelhem yehuala abebe", group: "G68" },
  { name: "biruk tadele argaw", group: "G68" },
  { name: "estifanos ameha mekonnen", group: "G68" },
  { name: "firomsa assefa roba", group: "G68" },
  { name: "foziya damtew abate", group: "G68" },
  { name: "gemechu alemu bedasa", group: "G68" },
  { name: "hana mesfin degsew", group: "G68" },
  { name: "ibrahim muhaba ismael", group: "G68" },
  { name: "kidist ayele mulat", group: "G68" },
  { name: "lencho lachisa nagasa", group: "G68" },
  { name: "miraf amare haile", group: "G68" },
  { name: "muhammed samson mamo", group: "G68" },
  { name: "nibru kefyalew tessema", group: "G68" },
  { name: "obsa abdulkadir adem", group: "G68" },
  { name: "remedan jemal gemeda", group: "G68" },
  { name: "segni girma guta", group: "G68" },
  { name: "tsedniya frezewed ayele", group: "G68" },
  { name: "uzair abdulalim bedewi", group: "G68" },
  { name: "webi muleta dinka", group: "G68" },
  { name: "yabets zekaryas manale", group: "G68" },
  { name: "yohanan solomon megerssa", group: "G68" },
  { name: "yohannes gezachew mokonnen", group: "G68" },
  { name: "zaferan miftah akmel", group: "G68" },
  // G69 Students
  { name: "abdiwak amsalu duressa", group: "G69" },
  { name: "abdulaziz isa seid", group: "G69" },
  { name: "abdulbaset adem", group: "G69" },
  { name: "abredagn kebede dimore", group: "G69" },
  { name: "ahlam zeynu redi", group: "G69" },
  { name: "bemnet mussa meshesha", group: "G69" },
  { name: "bereket kume kebede", group: "G69" },
  { name: "chernet mequannent bantie", group: "G69" },
  { name: "elham abdu", group: "G69" },
  { name: "eyerusalem hailemariam agegnehu", group: "G69" },
  { name: "ezra leye lemecha", group: "G69" },
  { name: "fenet damena tefera", group: "G69" },
  { name: "firaol gelana ararsa", group: "G69" },
  { name: "gebriel admasu abuye", group: "G69" },
  { name: "huzeyfa suleyman kemal", group: "G69" },
  { name: "jaefer mohammed kemal", group: "G69" },
  { name: "Jaleta Kebede Kasure", group: "G69" },
  { name: "kalid jemal adem", group: "G69" },
  { name: "leul gedion tiruneh", group: "G69" },
  { name: "liben adugna wako", group: "G69" },
  { name: "matthias mulugeta abate", group: "G69" },
  { name: "meheretu abate erana", group: "G69" },
  { name: "robsen teshoma", group: "G69" },
  { name: "sabona waktole tafese", group: "G69" },
  { name: "sadam husen ali", group: "G69" },
  { name: "salim jibril abdulkader", group: "G69" },
  { name: "samrawit alemu abshiro", group: "G69" },
  { name: "sifhoran regassa gidisa", group: "G69" },
  { name: "surafel takele injigu", group: "G69" },
  { name: "yafet tesfaye lema", group: "G69" },
];

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB for seeding students.');
    // Optionally clear existing students for each group
    await StudentModel.deleteMany({ group: { $in: ["G61", "G62", "G63", "G64", "G65", "G66", "G67", "G68", "G69"] } });
    
    const inserted = await StudentModel.insertMany(students);
    console.log(`Inserted ${inserted.length} students`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });