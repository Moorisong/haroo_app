import React from 'react';
import '../App.css';

export const PartialDeletePage: React.FC = () => {
    return (
        <div className="legal-container">
            <h1>선택적 데이터 삭제 안내</h1>
            <p className="last-updated">최종 수정일: 2025년 12월 24일</p>

            <section>
                <h2>선택적 데이터 삭제</h2>
                <p>
                    앱 내 설정에서 일부 데이터를 선택적으로 삭제할 수 있습니다.
                </p>
                <p>
                    계정 전체를 삭제하지 않아도 원하는 데이터만 관리할 수 있습니다.
                </p>
            </section>

            <section>
                <h2>삭제 가능한 데이터</h2>
                <ul>
                    <li><strong>차단 목록:</strong> 설정 → 차단한 사용자에서 개별 해제 가능</li>
                    <li><strong>메시지:</strong> 메시지는 전송 후 24시간 뒤 자동 만료됩니다</li>
                    <li><strong>메시지 모드:</strong> 진행 중인 연결을 종료할 수 있습니다</li>
                </ul>
            </section>

            <section>
                <h2>자동 삭제 정책</h2>
                <p>
                    일부 데이터는 자동으로 삭제됩니다:
                </p>
                <ul>
                    <li>메시지: 전송 후 24시간 만료, 7일 후 완전 삭제</li>
                    <li>만료된 메시지 모드: 기간 종료 후 기록만 보관</li>
                </ul>
            </section>

            <section>
                <h2>문의</h2>
                <p>
                    데이터 삭제 관련 문의사항이 있으시면 아래 이메일로 연락해 주세요.
                </p>
                <p className="contact-email">
                    <a href="mailto:thiagooo@naver.com">thiagooo@naver.com</a>
                </p>
            </section>
        </div>
    );
};
