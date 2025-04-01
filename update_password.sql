-- Habilita a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Atualiza a senha do usuário para 'igor123'
UPDATE auth.users
SET 
    encrypted_password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',    -- Senha: igor123
    updated_at = NOW(),                                                                        -- Atualiza o timestamp
    recovery_token = NULL,                                                                     -- Limpa o token de recuperação
    recovery_sent_at = NULL                                                                    -- Limpa o timestamp de recuperação
WHERE 
    id = '120bc535-c088-4c3d-bb4d-47531e52bf62'                                              -- ID do usuário
    AND email = 'brandaodeveloperapp@gmail.com';                                              -- Email para dupla verificação

-- Verifica se a atualização foi bem sucedida
SELECT 
    id,
    email,
    updated_at,
    recovery_token
FROM auth.users 
WHERE id = '120bc535-c088-4c3d-bb4d-47531e52bf62'; 