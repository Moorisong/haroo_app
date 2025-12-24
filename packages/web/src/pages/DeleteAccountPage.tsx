import React from 'react';
import '../App.css';

export const DeleteAccountPage: React.FC = () => {
    return (
        <div className="legal-container">
            <h1>계정 및 데이터 삭제 안내</h1>
            <p className="last-updated">최종 수정일: 2025년 12월 24일</p>

            <section>
                <h2>계정 삭제 방법</h2>
                <p>
                    하루(Haroo) 앱 내에서 다음 절차를 통해 계정과 관련 데이터를 삭제할 수 있습니다:
                </p>
                <ol>
                    <li>앱 하단 메뉴에서 <strong>설정</strong>을 선택합니다.</li>
                    <li><strong>계정 삭제</strong> 버튼을 탭합니다.</li>
                    <li>안내에 따라 삭제를 확인합니다.</li>
                </ol>
            </section>

            <section>
                <h2>삭제되는 데이터</h2>
                <p>계정 삭제 시 다음 데이터가 즉시 삭제됩니다:</p>
                <ul>
                    <li>사용자 프로필 정보 (카카오 계정 ID, 닉네임)</li>
                    <li>보낸 메시지 및 받은 메시지</li>
                    <li>메시지 모드 기록</li>
                    <li>차단 목록</li>
                    <li>푸시 알림 설정</li>
                </ul>
            </section>

            <section>
                <h2>카카오 계정 연동 해제</h2>
                <p>
                    계정 삭제 시 카카오 계정 연동도 함께 해제됩니다.
                </p>
                <p>
                    카카오톡 앱에서 직접 연동을 해제하려면:
                    <br />
                    카카오톡 → 설정 → 카카오 계정 → 연결된 서비스 관리 → 하루(Haroo) → 연결 끊기
                </p>
            </section>

            <section>
                <h2>문의</h2>
                <p>
                    계정 삭제 관련 문의사항이 있으시면 아래 이메일로 연락해 주세요.
                </p>
                <p className="contact-email">
                    <a href="mailto:thiagooo@naver.com">thiagooo@naver.com</a>
                </p>
            </section>
        </div>
    );
};
