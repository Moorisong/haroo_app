import React from 'react';
import '../App.css';

export const PrivacyPage: React.FC = () => {
    return (
        <div className="legal-container">
            <h1>개인정보처리방침</h1>
            <p className="last-updated">최종 수정일: 2025년 12월 19일</p>

            <section>
                <h2>1. 개인정보의 수집 항목</h2>
                <p>Haroo는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
                <table>
                    <thead>
                        <tr>
                            <th>수집 항목</th>
                            <th>수집 목적</th>
                            <th>보유 기간</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>카카오 계정 ID</td>
                            <td>회원 식별 및 로그인</td>
                            <td>회원 탈퇴 시까지</td>
                        </tr>
                        <tr>
                            <td>카카오 닉네임</td>
                            <td>서비스 내 표시</td>
                            <td>회원 탈퇴 시까지</td>
                        </tr>
                        <tr>
                            <td>푸시 알림 토큰 (FCM)</td>
                            <td>푸시 알림 발송</td>
                            <td>회원 탈퇴 시까지</td>
                        </tr>
                        <tr>
                            <td>메시지 내용</td>
                            <td>메시지 전달</td>
                            <td>전송 후 7일</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section>
                <h2>2. 개인정보의 이용 목적</h2>
                <p>수집된 개인정보는 다음의 목적으로만 이용됩니다:</p>
                <ol>
                    <li>회원 가입 및 로그인 처리</li>
                    <li>메시지 전송 및 수신 서비스 제공</li>
                    <li>메시지 모드 신청/수락/거절 알림</li>
                    <li>새 메시지 도착 알림</li>
                    <li>서비스 이용 관련 공지사항 전달</li>
                    <li>부정 이용 방지 및 서비스 개선</li>
                </ol>
            </section>

            <section>
                <h2>3. 개인정보의 보유 및 파기</h2>
                <ol>
                    <li>
                        <strong>회원 정보:</strong> 회원 탈퇴 시 즉시 파기합니다.
                    </li>
                    <li>
                        <strong>메시지:</strong> 전송 후 24시간 뒤 만료 처리되며,
                        만료 후 7일이 경과하면 완전히 삭제됩니다.
                    </li>
                    <li>
                        <strong>푸시 토큰:</strong> 회원 탈퇴 시 또는 토큰 갱신 시 이전 토큰은 삭제됩니다.
                    </li>
                </ol>
            </section>

            <section>
                <h2>4. 개인정보의 제3자 제공</h2>
                <p>
                    Haroo는 원칙적으로 사용자의 개인정보를 제3자에게 제공하지 않습니다.
                    다만, 다음의 경우에는 예외로 합니다:
                </p>
                <ol>
                    <li>사용자가 사전에 동의한 경우</li>
                    <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ol>
            </section>

            <section>
                <h2>5. 개인정보의 안전성 확보 조치</h2>
                <p>Haroo는 개인정보의 안전한 처리를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                <ol>
                    <li>개인정보의 암호화 전송 (HTTPS/TLS)</li>
                    <li>비밀번호 등 중요 정보의 암호화 저장</li>
                    <li>접근 권한 관리 및 접근 통제</li>
                </ol>
            </section>

            <section>
                <h2>6. 사용자의 권리</h2>
                <p>사용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
                <ol>
                    <li>개인정보 열람 요청</li>
                    <li>개인정보 정정 요청</li>
                    <li>개인정보 삭제 요청 (회원 탈퇴)</li>
                    <li>개인정보 처리 정지 요청</li>
                </ol>
                <p>
                    위 권리 행사는 아래 문의 이메일을 통해 요청하실 수 있습니다.
                </p>
            </section>

            <section>
                <h2>7. 개인정보 보호책임자</h2>
                <p>
                    개인정보 처리에 관한 업무를 총괄해서 책임지고,
                    개인정보 처리와 관련한 불만처리 및 피해구제를 위하여
                    아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="contact-box">
                    <p><strong>개인정보 보호책임자</strong></p>
                    <p>이메일: <a href="mailto:thiagoo@naver.com">thiagoo@naver.com</a></p>
                </div>
            </section>

            <section>
                <h2>8. 개인정보처리방침의 변경</h2>
                <p>
                    이 개인정보처리방침은 법령이나 서비스의 변경에 따라 수정될 수 있습니다.
                    변경 시 서비스 내 공지를 통해 알려드리며, 변경된 방침은 공지 후 7일 뒤부터 효력이 발생합니다.
                </p>
            </section>

            <section>
                <h2>9. 문의</h2>
                <p>
                    개인정보 처리에 관한 문의는 아래 이메일로 연락해 주세요.
                </p>
                <p className="contact-email">
                    <a href="mailto:thiagoo@naver.com">thiagoo@naver.com</a>
                </p>
            </section>
        </div>
    );
};
