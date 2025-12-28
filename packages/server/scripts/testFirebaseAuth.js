/**
 * Firebase Admin SDK 인증 테스트 스크립트
 * 홈 서버에서 실행: node scripts/testFirebaseAuth.js
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

console.log('🔍 Firebase Admin SDK 인증 테스트 시작...\n');

// 1. Config 폴더 경로 확인
const configDir = path.join(__dirname, '../config');
console.log('📁 Config 디렉토리:', configDir);

if (!fs.existsSync(configDir)) {
    console.error('❌ Config 폴더가 존재하지 않습니다:', configDir);
    process.exit(1);
}

// 2. Firebase SDK 키 파일 찾기
const files = fs.readdirSync(configDir);
console.log('📄 Config 폴더 내 파일들:', files);

const serviceAccountFile = files.find(f => f.includes('firebase-adminsdk'));

if (!serviceAccountFile) {
    console.error('❌ Firebase Admin SDK 키 파일을 찾을 수 없습니다.');
    process.exit(1);
}

const serviceAccountPath = path.join(configDir, serviceAccountFile);
console.log('🔑 Firebase 키 파일 경로:', serviceAccountPath);

// 3. JSON 키 파일 내용 확인
try {
    const serviceAccount = require(serviceAccountPath);

    console.log('\n✅ JSON 파일 로드 성공');
    console.log('   Project ID:', serviceAccount.project_id);
    console.log('   Client Email:', serviceAccount.client_email);
    console.log('   Private Key ID:', serviceAccount.private_key_id);
    console.log('   Private Key exists:', !!serviceAccount.private_key);
    console.log('   Private Key length:', serviceAccount.private_key?.length);

    // 4. Firebase Admin SDK 초기화
    console.log('\n🚀 Firebase Admin SDK 초기화 시도...');

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin SDK 초기화 성공');
    }

    // 5. 실제 인증 테스트 (listUsers)
    console.log('\n🔐 Firebase Auth 테스트 (listUsers)...');

    admin.auth().listUsers(1)
        .then(res => {
            console.log('✅ Firebase 인증 성공!');
            console.log('   사용자 수:', res.users.length);
            if (res.users.length > 0) {
                console.log('   첫 번째 사용자 UID:', res.users[0].uid);
            }
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Firebase 인증 실패:', err.message);
            console.error('   에러 코드:', err.code);
            console.error('\n💡 가능한 원인:');
            console.error('   1. Firebase 프로젝트 ID가 일치하지 않음');
            console.error('   2. 서비스 계정 권한 부족 (Firebase Console에서 확인)');
            console.error('   3. Private Key가 손상되었거나 잘못됨');
            console.error('   4. 키 파일이 다른 프로젝트용임');
            console.error('\n🔧 해결 방법:');
            console.error('   Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 키 생성');
            process.exit(1);
        });

} catch (error) {
    console.error('❌ JSON 파일 로드 실패:', error.message);
    console.error('   파일 경로를 확인하거나 JSON 형식이 올바른지 확인하세요.');
    process.exit(1);
}
