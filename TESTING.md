# 테스트 가이드

## 빠른 실행

```bash
cd /home/moon/PRJ/GPT/mdedit
chmod +x run_dev.sh
./run_dev.sh
```

브라우저에서 `http://127.0.0.1:8000` 접속.

## 확인 포인트

1. 상태바 우측이 `● 서버 online (Pandoc OK)` 인지 확인
2. 샘플 문서가 프리뷰에 렌더링되는지 확인
3. `HWPX↓` 버튼 클릭 시 `.hwpx` 다운로드되는지 확인
4. API 문서 확인: `http://127.0.0.1:8000/docs`

## 참고

- 최초 변환 시 Pandoc이 자동 설치될 수 있어 수 초 걸릴 수 있음
- `templates/default.hwpx`가 placeholder면 패키지 기본 템플릿으로 변환됨
