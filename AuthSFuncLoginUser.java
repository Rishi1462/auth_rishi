package authentication;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityTransaction;
import jakarta.persistence.TypedQuery;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import authentication.dto.ServiceAccount;
import authentication.dto.UserXSession;
import db.HibernateUtilKlickrr;
import db.HibernateUtilKlickrrReadonly;
import dto.Session;
import dto.User;
import lombok.Setter;

/*
 * 
 * Klickrr CONFIDENTIAL
 * __________________
 * 
 *  Klickrr All Rights Reserved.
 * 
 * NOTICE:  All information contained herein is, and remains the property
 * of Klickrr and its suppliers, if any.  The intellectual and technical
 * concepts contained herein are proprietary to Klickrr and its suppliers
 * and may be covered by U.S. and Foreign Patents, patents in process, and are
 * protected by trade secret or copyright law. Dissemination of this information
 * or reproduction of this material is strictly forbidden unless prior written
 * permission is obtained from Klickrr.
 */
public class AuthSFuncLoginUser {

	private String g_sEmail;
	private String g_sIPAddress;
	private String g_sPassword;
	private String g_sUserAgent;
	private HttpServletResponse g_objResponse;
	private User g_objUserToLogin = null;
	private Session g_objSession;
	private ServiceAccount g_objService = null;
	private int g_iFailedLoginAttempts = 0;
	private LocalDateTime g_lockoutTime = null;
	@Setter private BCryptPasswordEncoder passwordEncoder = null;

	public UserXSession getResult() {
		UserXSession v_objUserXSession = null;
		if (null == this.g_objSession) {
		} else if (null == this.g_objUserToLogin) {
		} else {
			v_objUserXSession = new UserXSession(this.g_objUserToLogin, this.g_objSession);
		}
		return v_objUserXSession;
	}

	public void setEmail(String prm_sEmail) {
		this.g_sEmail = prm_sEmail;
	}

	public void setIPAddress(String prm_sIPAddress) {
		this.g_sIPAddress = prm_sIPAddress;
	}

	public void setService(ServiceAccount prm_objServiceToken) {
		this.g_objService = prm_objServiceToken;
	}

	public void setPassword(String prm_sPassword) {
		this.g_sPassword = prm_sPassword;
	}

	public void setResponse(HttpServletResponse prm_objResponse) {
		this.g_objResponse = prm_objResponse;
	}

	public void setUserAgent(String prm_sUserAgent) {
		this.g_sUserAgent = prm_sUserAgent;
	}

	public void startFunction() {
		try {
			this.loginUser();
			this.createUserSession();
		} catch (Exception v_exException) {
			v_exException.printStackTrace();
		} catch (Throwable v_exexception) {
		} finally {
		}
	}

	private void createUserSession() {
		Session v_objCreateSession;
		EntityManager v_em = null;
		EntityTransaction v_objTran = null;
		List<Session> v_lResults;
		TypedQuery<Session> v_objTypedQuery;
		try {
			if (null == this.g_objUserToLogin) {
				return;
			}
			v_em = HibernateUtilKlickrr.getEntityManager();
			v_objTypedQuery = v_em.createQuery("Select o From " + Session.class.getSimpleName() + " o Where o.userid = :prm_iUserId and o.ipaddress = :prm_iIPAddress and o.useragent = :prm_sUserAgent and o.logouttime is null order by o.sessionid desc", Session.class);
			v_objTypedQuery.setParameter("prm_sUserAgent", this.g_sUserAgent);
			v_objTypedQuery.setParameter("prm_iIPAddress", this.g_sIPAddress);
			v_objTypedQuery.setParameter("prm_iUserId", this.g_objUserToLogin.getUserid());
			v_lResults = v_objTypedQuery.getResultList();
			if (v_lResults.size() > 0) {
				this.g_objSession = v_lResults.get(0);
			} else {
				v_objCreateSession = new Session();
				v_objCreateSession.setIpaddress(this.g_sIPAddress);
				v_objCreateSession.setUserid(this.g_objUserToLogin.getUserid());
				v_objCreateSession.setUniqueid(UUID.randomUUID().toString());
				v_objCreateSession.setUseragent(this.g_sUserAgent);
				v_objCreateSession.setLastaccesstime(new Date());
				v_objCreateSession.setLogintime(new Date());
				v_objTran = v_em.getTransaction();
				v_objTran.begin();
				v_em.persist(v_objCreateSession);
				v_objTran.commit();
				v_lResults = v_objTypedQuery.getResultList();
				this.g_objSession = v_lResults.get(0);
			}
		} catch (Exception v_exException) {
			if (null == v_objTran) {
			} else if (v_objTran.isActive()) {
				v_objTran.rollback();
			}
			v_exException.printStackTrace();
		} catch (Throwable v_exexception) {
		} finally {
			if (null == v_em) {
			} else if (v_em.isOpen()) {
				v_em.close();
			}
		}
	}

	private void loginUser() {
		User v_objTestUser;
		EntityManager v_em = null;
		TypedQuery<User> v_objTypedQuery;
		List<User> v_lResults;
		int v_attempts;
		LocalDateTime v_lastAttempt;
		LocalDateTime v_now;
		boolean v_bPasswordMatch;
		boolean v_bServiceMatch;
		EntityTransaction v_tx;

		try {
			v_em = HibernateUtilKlickrrReadonly.getEntityManager();

			v_objTypedQuery = v_em.createQuery("SELECT o FROM " + User.class.getSimpleName()
					+ " o WHERE lower(o.email) = lower(:prm_sEmail) AND o.active = true", User.class);
			v_objTypedQuery.setParameter("prm_sEmail", this.g_sEmail);
			v_lResults = v_objTypedQuery.getResultList();
			if (!v_lResults.isEmpty()) {
				v_objTestUser = v_lResults.get(0);

				v_attempts = v_objTestUser.getNoOfAttempt();
				v_lastAttempt = v_objTestUser.getLastAttempt();
				v_now = LocalDateTime.now();
				if (5 > v_attempts) {
				}else if(null == v_lastAttempt) {
				}else if(v_lastAttempt.plusMinutes(15).isAfter(v_now)) {
					this.g_objResponse.setHeader("message",
							"Account locked due to multiple failed attempts. Try again in 15 minutes.");
					return;
				}

				v_bPasswordMatch = this.passwordEncoder.matches(this.g_sEmail.toLowerCase() + "-" + this.g_sPassword,
						v_objTestUser.getPassword());
				v_bServiceMatch = this.g_objService != null
						&& this.g_sPassword.equals(this.g_objService.getServiceAccount());
				if (v_bPasswordMatch || v_bServiceMatch) {
					v_objTestUser.setNoOfAttempt(0);
					v_objTestUser.setLastAttempt(null);
					this.g_objUserToLogin = v_objTestUser;
					System.out.println("Login successful.");
				} else {
					v_attempts++;
					v_objTestUser.setNoOfAttempt(v_attempts);
					v_objTestUser.setLastAttempt(v_now);

					if (v_attempts >= 5) {
						this.g_objResponse.setHeader("message",
								"Account locked due to multiple failed attempts. Try again in 15 minutes.");
						System.out.println("Account locked.");
					} else {
						this.g_objResponse.setHeader("message", "Invalid user credentials");
					}
				}

				v_tx = v_em.getTransaction();
				v_tx.begin();
				v_em.merge(v_objTestUser);
				v_tx.commit();
			} else {
				this.g_objResponse.setHeader("message", "Invalid user credentials");
			}

		} catch (Exception v_exException) {
			v_exException.printStackTrace();
		} finally {
			if (v_em != null && v_em.isOpen()) {
				v_em.close();
			}
		}
	}
}
